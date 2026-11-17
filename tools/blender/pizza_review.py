"""Étude Blender : trois poses fixes à valider avant toute animation.
Scène indépendante du site ; modèle de main CC0 déjà documenté dans le dépôt.
"""

import bpy, math, random, os, sys, argparse
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(
    description="Rendre une des trois poses de validation, sans modifier le site."
)
parser.add_argument("--stage", type=int, choices=[1, 2, 3], default=2)
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--samples", type=int, default=96)
parser.add_argument(
    "--build-only",
    action="store_true",
    help="Construire la scène sans lancer le rendu ni enregistrer de pose.",
)
parser.add_argument("--threads", type=int, default=3)
args = parser.parse_args(
    sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
)
OUT = str(args.output.resolve())
os.makedirs(OUT, exist_ok=True)
random.seed(41)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = args.samples
scene.cycles.use_denoising = False
scene.render.resolution_x = 1200
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.world.color = (0.3, 0.3, 0.3)
scene.view_settings.view_transform = "AgX"
scene.render.threads_mode = "FIXED"
scene.render.threads = args.threads


def mat(name, color, rough=0.48, subsurface=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*color, 1)
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Subsurface Weight"].default_value = subsurface
    return m


floor = mat("Fond — ivoire chaud", (0.69, 0.65, 0.57), 0.8)
dough = mat("Mie — crème", (0.71, 0.49, 0.25), 0.65)
sauce = mat("Tomate cuite", (0.49, 0.065, 0.027), 0.42)
cheese = mat("Mozzarella fondue", (0.82, 0.57, 0.22), 0.35, 0.045)
crust = mat("Croûte dorée", (0.65, 0.31, 0.075), 0.52, 0.025)
# De petites variations de cuisson restent dans la matière, sans photo plaquée.
nt = crust.node_tree
noise = nt.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 65
noise.inputs["Detail"].default_value = 2
# La croûte reste d’une couleur de cuisson unie ; le bruit sert seulement au relief.
bump = nt.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.09
bump.inputs["Distance"].default_value = 0.018
nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
nt.links.new(bump.outputs["Normal"], nt.nodes.get("Principled BSDF").inputs["Normal"])
red = mat("Tomates — peau", (0.57, 0.055, 0.025), 0.3, 0.04)
flesh = mat("Tomates — chair", (0.8, 0.14, 0.06), 0.37, 0.05)
seeds = mat("Pépins", (0.81, 0.63, 0.25), 0.35)
green = mat("Basilic", (0.075, 0.20, 0.055), 0.5, 0.035)
vein = mat("Nervure", (0.22, 0.33, 0.11), 0.55)
skin = mat("Main — argile pêche", (0.68, 0.39, 0.24), 0.52, 0.075)
cloth = mat("Manche — bleu ardoise", (0.065, 0.14, 0.18), 0.85)
wood = mat("Planche — bois chaud", (0.28, 0.14, 0.065), 0.65)
nt = wood.node_tree
n = nt.nodes.new("ShaderNodeTexNoise")
n.inputs["Scale"].default_value = 5
n.inputs["Roughness"].default_value = 0.8
tex = nt.nodes.new("ShaderNodeTexCoord")
mapping = nt.nodes.new("ShaderNodeVectorMath")
mapping.operation = "MULTIPLY"
mapping.inputs[1].default_value = (1, 16, 3)
nt.links.new(tex.outputs["Generated"], mapping.inputs[0])
nt.links.new(mapping.outputs[0], n.inputs["Vector"])
b = nt.nodes.new("ShaderNodeBump")
b.inputs["Strength"].default_value = 0.14
b.inputs["Distance"].default_value = 0.035
nt.links.new(n.outputs["Fac"], b.inputs["Height"])
nt.links.new(b.outputs["Normal"], nt.nodes.get("Principled BSDF").inputs["Normal"])


def mesh(name, vertices, faces, material, parent=None, smooth=False):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    obj.parent = parent
    for p in data.polygons:
        p.use_smooth = smooth
    return obj


def bevel(obj, width=0.015):
    mod = obj.modifiers.new("Arêtes adoucies", "BEVEL")
    mod.width = width
    mod.segments = 3
    mod = obj.modifiers.new("Normales de surface", "WEIGHTED_NORMAL")
    mod.keep_sharp = True
    return obj


def sphere(name, pos, scale, material, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, location=pos)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    o.data.materials.append(material)
    o.parent = parent
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def sector(name, radius, angle, z, depth, material, parent):
    # Volume fermé : les faces de coupe révèlent la pâte, la sauce et le fromage.
    pts = [(0, 0)] + [
        (
            radius
            * math.cos(angle - math.pi / 8 + 0.004 + k / 36 * (math.pi / 4 - 0.008)),
            radius
            * math.sin(angle - math.pi / 8 + 0.004 + k / 36 * (math.pi / 4 - 0.008)),
        )
        for k in range(37)
    ]
    n = len(pts)
    verts = [(x, y, h) for h in [z, z + depth] for x, y in pts]
    faces = [tuple(reversed(range(n))), tuple(range(n, n * 2))] + [
        (i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)
    ]
    return bevel(mesh(name, verts, faces, material, parent), 0.009)


def crust_segment(angle, parent):
    verts = []
    faces = []
    steps = 64
    sides = 20
    for i in range(steps + 1):
        a = angle - math.pi / 8 + 0.005 + i / steps * (math.pi / 4 - 0.01)
        for j in range(sides):
            t = j / sides * math.tau
            rr = 1.86 + math.cos(t) * (0.175 + 0.008 * math.sin(a * 17))
            zz = 0.18 + math.sin(t) * (0.145 + 0.008 * math.sin(a * 11))
            verts.append((rr * math.cos(a), rr * math.sin(a), zz))
    for i in range(steps):
        for j in range(sides):
            a = i * sides + j
            b = i * sides + (j + 1) % sides
            faces.append((a, b, b + sides, a + sides))
    faces.extend(
        [
            tuple(reversed(range(sides))),
            tuple(range(steps * sides, (steps + 1) * sides)),
        ]
    )
    o = mesh("Cornicione gonflé", verts, faces, crust, parent, True)
    # Les deux faces coupées reçoivent une matière de mie.
    o.data.materials.append(dough)
    o.data.polygons[-1].material_index = 1
    o.data.polygons[-2].material_index = 1
    o.data.polygons[-1].use_smooth = False
    o.data.polygons[-2].use_smooth = False
    return o


def leaf(pos, angle, parent):
    verts = []
    faces = []
    for i in range(17):
        t = i / 16
        for j in range(7):
            v = j / 3 - 1
            x = (t - 0.5) * 0.45
            y = v * 0.12 * math.sin(t * math.pi)
            z = 0.045 * math.sin(t * math.pi) + 0.014 * abs(v)
            verts.append(
                (
                    pos[0] + x * math.cos(angle) - y * math.sin(angle),
                    pos[1] + x * math.sin(angle) + y * math.cos(angle),
                    pos[2] + z,
                )
            )
    for i in range(16):
        for j in range(6):
            a = i * 7 + j
            faces.append((a, a + 1, a + 8, a + 7))
    o = mesh("Feuille de basilic", verts, faces, green, parent, True)
    sol = o.modifiers.new("Épaisseur de feuille", "SOLIDIFY")
    sol.thickness = 0.006
    return o


held = bpy.data.objects.new("Part soulevée et main", None)
bpy.context.collection.objects.link(held)
fixed = bpy.data.objects.new("Sept parts fixes", None)
bpy.context.collection.objects.link(fixed)
for i in range(8):
    a = i * math.pi / 4
    parent = held if i == 0 else fixed
    sector("Pâte fine", 1.92, a, 0.015, 0.075, dough, parent)
    sector("Sauce tomate", 1.76, a, 0.09, 0.022, sauce, parent)
    sector("Fromage fondu", 1.73, a, 0.112, 0.035, cheese, parent)
    crust_segment(a, parent)
    for k in range(4):
        rr = 0.5 + k * 0.31
        aa = a + random.uniform(-0.18, 0.18)
        sphere(
            "Relief de mozzarella",
            (rr * math.cos(aa), rr * math.sin(aa), 0.15),
            (random.uniform(0.15, 0.23), random.uniform(0.13, 0.21), 0.016),
            cheese,
            parent,
        )
    rr = 1.02 + random.uniform(-0.15, 0.15)
    aa = a + random.uniform(-0.14, 0.14)
    x, y = rr * math.cos(aa), rr * math.sin(aa)
    # Demi-tomate en relief et surface de coupe avec quelques pépins discrets.
    sphere("Demi tomate cerise", (x, y, 0.19), (0.21, 0.18, 0.09), red, parent)
    sphere("Chair de tomate", (x, y, 0.244), (0.18, 0.15, 0.025), flesh, parent)
    for sign in [-1, 1]:
        for k in range(3):
            sphere(
                "Pépin",
                (x + sign * 0.075, y + (k - 1) * 0.05, 0.266),
                (0.012, 0.022, 0.006),
                seeds,
                parent,
            )
    if i in [0, 1, 3, 4, 6]:
        rr = 1.4
        aa = a + 0.10
        leaf((rr * math.cos(aa), rr * math.sin(aa), 0.18), a + 0.6, parent)
    # Petites marques de cuisson volontairement espacées.
    for k in range(3):
        rr = random.uniform(0.4, 1.6)
        aa = a + random.uniform(-0.21, 0.21)
        sphere(
            "Point de cuisson",
            (rr * math.cos(aa), rr * math.sin(aa), 0.158),
            (0.025, 0.035, 0.004),
            crust,
            parent,
        )

bpy.ops.mesh.primitive_cylinder_add(
    vertices=128, radius=2.22, depth=0.09, location=(0, 0, -0.055)
)
board = bpy.context.object
board.name = "Planche de présentation"
board.data.materials.append(wood)
bevel(board, 0.035)
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.12))
bpy.context.object.data.materials.append(floor)
# Main CC0 existante : normalisation du GLB, puis paume tournée vers le haut.
existing = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(
    filepath=str(ROOT / "public/assets/models/anatomical-hand.glb")
)
new = [o for o in bpy.context.scene.objects if o not in existing]
for o in list(new):
    if o.type == "MESH" and "Avery" not in o.name:
        bpy.data.objects.remove(o, do_unlink=True)
        new.remove(o)
C = Matrix.Rotation(math.pi / 2, 4, "X")
N = (
    Matrix.Translation(Vector((0.15295006, -0.38279729, 0.12114368)))
    @ Quaternion((0.63759134, -0.02298459, 0.76889286, 0.04186606)).to_matrix().to_4x4()
    @ Matrix.Scale(8.16716936, 4)
)
wrap = bpy.data.objects.new("Main — repère paume vers le haut", None)
bpy.context.collection.objects.link(wrap)
wrap.parent = held
wrap.matrix_local = (
    Matrix.Translation(Vector((2.65, 0, -0.14)))
    @ Matrix.Rotation(math.pi, 4, "X")
    @ C
    @ N
    @ C.inverted()
)
for o in new:
    if o.parent is None:
        o.parent = wrap
bpy.context.view_layer.update()
arm = next(o for o in new if o.type == "ARMATURE")
for finger in ["index", "middle", "ring", "pinky"]:
    pb = arm.pose.bones[finger + "_01_r"]
    world = arm.matrix_world @ pb.matrix
    head = world.translation.copy()
    pb.matrix = (
        arm.matrix_world.inverted()
        @ Matrix.Translation(head)
        @ Matrix.Rotation(-0.12, 4, "Y")
        @ Matrix.Translation(-head)
        @ world
    )
# Le pouce monte au-dessus du cornicione, tandis que les quatre doigts restent
# sous la pâte. La rotation agit sur l’articulation de base du squelette.
pb = arm.pose.bones["thumb_01_r"]
world = arm.matrix_world @ pb.matrix
head = world.translation.copy()
pb.matrix = (
    arm.matrix_world.inverted()
    @ Matrix.Translation(head)
    @ Matrix.Rotation(0.22, 4, "Y")
    @ Matrix.Translation(-head)
    @ world
)
bpy.context.view_layer.update()
for o in new:
    if o.type == "MESH":
        o.data.materials.clear()
        o.data.materials.append(skin)
        for p in o.data.polygons:
            p.use_smooth = True
        sub = o.modifiers.new("Surface de peau lissée", "SUBSURF")
        sub.levels = 1
        sub.render_levels = 2
# Une manche courte raccordée au poignet, sans prolongement de peau artificiel.
bpy.ops.mesh.primitive_cone_add(
    vertices=64,
    radius1=0.30,
    radius2=0.4,
    depth=4.5,
    location=(4.6, 0, -0.14),
    rotation=(0, math.pi / 2, 0),
)
sleeve = bpy.context.object
sleeve.name = "Manche"
sleeve.scale = (0.65, 1, 1)
sleeve.data.materials.append(cloth)
sleeve.parent = held
bevel(sleeve, 0.05)
for p in sleeve.data.polygons:
    p.use_smooth = True

crumbs = []
for i in range(14):
    x = random.uniform(0.55, 1.8)
    y = random.uniform(-0.26, 0.26)
    o = sphere(
        "Miette", (x, y, 0.014), (0.014 + random.random() * 0.016, 0.013, 0.009), dough
    )
    crumbs.append(o)


def area(name, location, power, size):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.shape = "DISK"
    data.size = size
    o = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(o)
    o.location = location
    o.rotation_euler = (
        (Vector((0, 0, 0.4)) - o.location).to_track_quat("-Z", "Y").to_euler()
    )


area("Grande boîte à lumière", (1, -4, 7), 850, 5)
area("Réflecteur doux", (-4, 1, 5), 550, 4)
area("Détourage", (4, 4, 6), 750, 3)
cam_data = bpy.data.cameras.new("Camera de validation")
cam = bpy.data.objects.new("Camera de validation", cam_data)
bpy.context.collection.objects.link(cam)
scene.camera = cam
cam_data.type = "ORTHO"
cam_data.ortho_scale = 7.3


def camera(pos, target, scale):
    cam.location = pos
    cam.rotation_euler = (
        (Vector(target) - cam.location).to_track_quat("-Z", "Y").to_euler()
    )
    cam_data.ortho_scale = scale


def view(stage):
    held.hide_render = stage == 3
    for obj in held.children_recursive:
        obj.hide_render = stage == 3
    held.location = (0.12, 0, 0.95) if stage == 2 else (0, 0, 0)
    held.rotation_euler = (0, -0.05, 0) if stage == 2 else (0, 0, 0)
    wrap.hide_render = stage != 2
    for o in new:
        o.hide_render = stage != 2
    sleeve.hide_render = stage != 2
    for o in crumbs:
        o.hide_render = stage != 3
    if stage == 2:
        camera((4.4, -7.2, 5.2), (1.5, -0.1, 0.9), 4.7)
    else:
        camera((0, -0.001, 9), (0, 0, 0), 6.6)
    bpy.context.view_layer.update()


stage = args.stage
view(stage)
if not args.build_only:
    bpy.ops.wm.save_as_mainfile(filepath=OUT + "/pose-%02d.blend" % stage)
    scene.render.filepath = OUT + "/pose-%02d.png" % stage
    bpy.ops.render.render(write_still=True)
