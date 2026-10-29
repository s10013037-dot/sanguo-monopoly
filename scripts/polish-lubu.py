"""Reproducible Blender 4.3 mesh finishing, not a claim of manual sculpting.
Keep the glTF node rig and separate fluted hair locks; finish the dedicated face and lion relief.
"""
import argparse, hashlib, json, sys
from pathlib import Path
import bpy

parser = argparse.ArgumentParser()
parser.add_argument('--input-dir', required=True)
parser.add_argument('--output-dir', required=True)
parser.add_argument('--report', required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
output = Path(args.output_dir)
output.mkdir(parents=True, exist_ok=True)
report = {'revision': '3.8.0', 'tool': 'Blender ' + bpy.app.version_string, 'manualSculpt': False, 'assets': {}}

def apply(obj, modifier):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)

def voxel_finish(obj, voxel, reduction):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    obj.data = obj.data.copy()
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    remesh = obj.modifiers.new('Unite authored volumes', 'REMESH')
    remesh.mode = 'VOXEL'
    remesh.voxel_size = voxel
    remesh.use_smooth_shade = True
    apply(obj, remesh)
    smooth = obj.modifiers.new('Soften union seams', 'SMOOTH')
    smooth.factor = .46
    smooth.iterations = 3
    apply(obj, smooth)
    decimate = obj.modifiers.new('Realtime polygon budget', 'DECIMATE')
    decimate.ratio = reduction
    apply(obj, decimate)
    for face in obj.data.polygons:
        face.use_smooth = True

for detail in ['board', 'display']:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    source = Path(args.input_dir) / ('lubu-' + detail + '.glb')
    bpy.ops.import_scene.gltf(filepath=str(source))
    for obj in list(bpy.context.scene.objects):
        if obj.type != 'MESH':
            continue
        if obj.name.startswith('Hair_Locks'):
            # Keep individually authored fluted locks and their points instead of melting them into a blob.
            for face in obj.data.polygons:
                face.use_smooth = True
        elif obj.name.startswith('Beast_Relief'):
            voxel_finish(obj, .014 if detail == 'board' else .009, .60)
        elif obj.name.startswith('Face_PVC'):
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.mesh.tris_convert_to_quads(face_threshold=.72, shape_threshold=.72)
            bpy.ops.object.mode_set(mode='OBJECT')
            # One real subdivision pass on the dedicated face, not all armor/feathers.
            subdiv = obj.modifiers.new('Continuous PVC face', 'SUBSURF')
            subdiv.levels = 1
            subdiv.subdivision_type = 'CATMULL_CLARK'
            apply(obj, subdiv)
            for face in obj.data.polygons:
                face.use_smooth = True
    # Clear imported custom normals on the sculpted meshes so the finished geometry controls shading.
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH' and (obj.name.startswith('Face_PVC') or obj.name.startswith('Hair_Locks')):
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            if obj.data.has_custom_normals:
                bpy.ops.mesh.customdata_custom_splitnormals_clear()
    root = bpy.data.objects.get('character-lvbu')
    if root is None:
        raise RuntimeError('The existing character rig was lost')
    root['artRevision'] = '3.8.0'
    root['meshPipeline'] = 'authored-fluted-locks + Blender relief/smooth/subdivision'
    root['manualSculpt'] = False
    dest = output / ('lubu-' + detail + '.glb')
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    triangles = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
    limit = 42000 if detail == 'board' else 100000
    if triangles > limit:
        print('POLYGON_BUDGET', sorted([(o.name, sum(len(p.vertices)-2 for p in o.data.polygons)) for o in meshes], key=lambda p:-p[1])[:8], flush=True)
        raise RuntimeError(f'{detail} exceeds {limit} triangles: {triangles}')
    bpy.ops.export_scene.gltf(filepath=str(dest), export_format='GLB', export_yup=True,
        export_extras=True, export_animations=False, export_apply=True, export_cameras=False,
        export_lights=False, export_texcoords=False, export_materials='EXPORT')
    report['assets'][detail] = {'file': dest.name, 'bytes': dest.stat().st_size, 'triangles': triangles,
        'meshObjects': len(meshes), 'sha256': hashlib.sha256(dest.read_bytes()).hexdigest()}
    print('LUBU_FINISHED', detail, report['assets'][detail], flush=True)
Path(args.report).parent.mkdir(parents=True, exist_ok=True)
Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
