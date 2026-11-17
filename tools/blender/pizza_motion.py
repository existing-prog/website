"""Prévisualisation native Blender de six secondes, sans intégration au scroll.

La scène de revue est réutilisée. Les poses sont échantillonnées dans des clés
Blender éditables : aucun script de lecture n’est nécessaire dans le .blend.
"""

import argparse
import json
import math
from pathlib import Path
import runpy
import sys
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector

parser = argparse.ArgumentParser()
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--width", type=int, default=768)
parser.add_argument("--samples", type=int, default=8)
parser.add_argument("--fps", type=int, default=24)
parser.add_argument("--duration", type=float, default=6)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
output = args.output.resolve()
(output / "raw").mkdir(parents=True, exist_ok=True)

# Construire les mêmes modèles et matières que les trois images déjà présentées.
original_argv = sys.argv[:]
try:
    sys.argv = [
        "pizza_review.py",
        "--",
        "--stage",
        "2",
        "--output",
        str(output),
        "--build-only",
    ]
    review = runpy.run_path(str(Path(__file__).with_name("pizza_review.py")))
finally:
    sys.argv = original_argv
scene = bpy.context.scene
held, wrap, sleeve = review["held"], review["wrap"], review["sleeve"]
arm, cam, board = review["arm"], scene.camera, review["board"]
crumbs = review["crumbs"]
mobile_parts = [o for o in held.children if o.type == "MESH" and o != sleeve]
held.location = (0, 0, 0)
held.rotation_euler = (0, 0, 0)
bpy.context.view_layer.update()

# Une planche un peu plus épaisse laisse passer le poignet à son bord : la main
# ne traverse pas le sol pendant son approche. Le dessus reste au même niveau.
board.scale.z = 3.2
board.location.z = -0.154
bpy.context.view_layer.objects.active = board
bpy.ops.object.select_all(action="DESELECT")
board.select_set(True)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.data.objects["Plane"].location.z = -0.30

hand_motion = bpy.data.objects.new("Approche indépendante de la main", None)
bpy.context.collection.objects.link(hand_motion)
hand_motion.parent = held
wrap.parent = hand_motion
sleeve.parent = hand_motion
# Un bord de manche arrondi couvre la fermeture du maillage au poignet.
bpy.ops.mesh.primitive_torus_add(
    major_radius=0.285,
    minor_radius=0.027,
    major_segments=48,
    minor_segments=12,
    location=(2.32, 0, -0.14),
    rotation=(0, math.pi / 2, 0),
)
cuff = bpy.context.object
cuff.name = "Bord de manche arrondi"
cuff.scale = (0.68, 1.04, 1)
cuff.data.materials.append(review["cloth"])
cuff.parent = hand_motion
for polygon in cuff.data.polygons:
    polygon.use_smooth = True
sleeve.scale.x *= 1.03
sleeve.scale.y *= 1.035
hand_objects = [o for o in hand_motion.children_recursive if o.type == "MESH"]

# Le pouce arrive légèrement ouvert, puis sa pulpe descend sur la croûte.
thumb = arm.pose.bones["thumb_01_r"]
thumb.rotation_mode = "QUATERNION"
closed_thumb = thumb.rotation_quaternion.copy()
world = arm.matrix_world @ thumb.matrix
head = world.translation.copy()
thumb.matrix = (
    arm.matrix_world.inverted()
    @ Matrix.Translation(head)
    @ Matrix.Rotation(0.14, 4, "Y")
    @ Matrix.Translation(-head)
    @ world
)
open_thumb = thumb.rotation_quaternion.copy()
thumb.rotation_quaternion = closed_thumb

# La souplesse de la pointe est indépendante de la prise. La croûte garde sa
# forme ; tous les ingrédients suivent le même léger affaissement de la pâte.
flex_keys = []
for obj in mobile_parts:
    obj.shape_key_add(name="Repos")
    key = obj.shape_key_add(name="Pointe souple")
    inverse = obj.matrix_local.to_3x3().inverted()
    for point in key.data:
        local = obj.matrix_local @ point.co
        weight = max(0, min(1, (1.55 - local.x) / 1.55)) ** 2
        point.co += inverse @ Vector((0, 0, -0.10 * weight))
    flex_keys.append(key)

scene.render.engine = "CYCLES"
scene.cycles.samples = args.samples
scene.cycles.use_denoising = False
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 2
scene.render.resolution_x = args.width
scene.render.resolution_y = round(args.width * 2 / 3)
scene.render.resolution_percentage = 100
scene.render.fps = args.fps
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(output / "raw" / "frame-")
frames = round(args.duration * args.fps)
scene.frame_start = 1
scene.frame_end = frames
scene["preview_duration_seconds"] = args.duration
scene["hand_license"] = "CC0 — voir public/assets/models/ANATOMICAL-HAND-LICENSE.txt"
cam.rotation_mode = "QUATERNION"


def ease(value, start, end):
    t = max(0, min(1, (value - start) / (end - start)))
    return t * t * t * (t * (t * 6 - 15) + 10)


def mix(a, b, t):
    return a + (b - a) * t


def key(obj, path, frame):
    obj.keyframe_insert(data_path=path, frame=frame)


crumb_scales = [o.scale.copy() for o in crumbs]
previous_rotation = None
checks = []
for frame in range(1, frames + 1):
    scene.frame_set(frame)
    time = (frame - 1) / (frames - 1) * 6
    approach = ease(time, 0.45, 1.0)
    grip = ease(time, 1.0, 1.5)
    lift = ease(time, 1.5, 2.7)
    departure = ease(time, 3.05, 4.0)
    return_top = ease(time, 4.25, 5.45)
    side = ease(time, 1.3, 2.7) * (1 - return_top)
    target = Vector((mix(0, 0.6, side) + 0.55 * return_top, 0, 0.55 * side))
    phi = mix(0.001, 1.065, side)
    azimuth = mix(-math.pi / 2, -1.069, side)
    cam.location = target + Vector(
        (
            9 * math.sin(phi) * math.cos(azimuth),
            9 * math.sin(phi) * math.sin(azimuth),
            9 * math.cos(phi),
        )
    )
    rotation = (target - cam.location).to_track_quat("-Z", "Y")
    if previous_rotation is not None and rotation.dot(previous_rotation) < 0:
        rotation.negate()
    previous_rotation = rotation.copy()
    cam.rotation_quaternion = rotation
    cam.data.ortho_scale = mix(mix(6.9, 6.5, side), 7.1, return_top)
    key(cam, "location", frame)
    key(cam, "rotation_quaternion", frame)
    key(cam.data, "ortho_scale", frame)
    hand_motion.location = (mix(7, 0.6, approach) - 0.6 * grip, 0, 0)
    key(hand_motion, "location", frame)
    thumb.rotation_quaternion = open_thumb.slerp(closed_thumb, grip)
    key(thumb, "rotation_quaternion", frame)
    held.location = (0.12 * lift, 0, 0.28 * ease(time, 1.0, 1.3) + 0.83 * lift)
    held.rotation_euler = (0, -0.05 * lift, -0.025 * departure)
    # La sortie suit la droite de la caméra, puis reste définitivement hors champ.
    right = rotation @ Vector((1, 0, 0))
    up = rotation @ Vector((0, 1, 0))
    held.location += right * (11 * departure) + up * (2 * departure)
    key(held, "location", frame)
    key(held, "rotation_euler", frame)
    hidden = time >= 4.1
    for obj in mobile_parts + hand_objects:
        obj.hide_render = hidden
        key(obj, "hide_render", frame)
    for shape in flex_keys:
        shape.value = lift * (1 + 0.035 * math.sin(lift * math.pi))
        key(shape, "value", frame)
    for obj, scale in zip(crumbs, crumb_scales):
        amount = ease(time, 3.65, 4.45)
        obj.hide_render = amount <= 0
        obj.scale = scale * max(0.0001, amount)
        key(obj, "hide_render", frame)
        key(obj, "scale", frame)
    bpy.context.view_layer.update()
    if hidden:
        minimum = min(
            world_to_camera_view(scene, cam, obj.matrix_world @ Vector(corner)).x
            for obj in mobile_parts
            for corner in obj.bound_box
        )
        if minimum <= 1.05:
            raise RuntimeError(
                f"La part changerait de visibilité dans le cadre : image {frame}, bord {minimum}"
            )
        checks.append(round(minimum, 3))

# Les courbes ont déjà été adoucies dans la fonction ease. Des clés linéaires
# évitent les dépassements entre poses et des changements d’échelle inattendus.
for action in bpy.data.actions:
    for curve in action.fcurves:
        for point in curve.keyframe_points:
            point.interpolation = (
                "CONSTANT" if curve.data_path.endswith("hide_render") else "LINEAR"
            )
for seconds, label in [
    (0, "Vue du dessus"),
    (0.45, "Approche"),
    (1.5, "Prise"),
    (2.7, "Part soulevée"),
    (3.05, "Sortie unique"),
    (4.25, "Retour de la caméra"),
    (5.45, "Miettes et fin"),
]:
    marker = scene.timeline_markers.new(label)
    marker.frame = 1 + round(seconds / 6 * (frames - 1))
scene.frame_set(1)
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(output / "pizza-motion.blend"))
(output / "motion.json").write_text(
    json.dumps(
        {
            "frames": frames,
            "fps": args.fps,
            "duration": args.duration,
            "width": scene.render.resolution_x,
            "height": scene.render.resolution_y,
            "minimum_hidden_slice_x": min(checks),
            "samples": args.samples,
        },
        indent=2,
    )
)
print("MOTION_READY", frames, "images", args.duration, "secondes")
