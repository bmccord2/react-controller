import sys
sys.path.append("./lib/")
import atexit
import traceback
import pyvjoy
from collections import OrderedDict
from flask import Flask, request
from flask_restplus import Api, Resource, fields

app = Flask(__name__)
api = Api(app)

MAX_CONTROLLERS = 4
controllers = OrderedDict()

command_parser = api.parser()
command_parser.add_argument('command', location='json',
    type=str, required=True)

controller_id_parser = api.parser()
controller_id_parser.add_argument('id', location='args',
    type=int, required=False)

def createController(_id):
    try:
        return pyvjoy.VJoyDevice(_id)
    except pyvjoy.vJoyFailedToAcquireException:
        print('Failed to aquire device, attempting to relinquish')
        pyvjoy._sdk.RelinquishVJD(_id)
        return pyvjoy.VJoyDevice(_id)

def deleteController(_id):
    pyvjoy._sdk.RelinquishVJD(_id)
    del controllers[int(_id)]

def updateState(_id, state):
    print(controllers)
    j = controllers[_id]
    if 'leftPadX' in state:
        xValue = int(((state['leftPadX']  + 1) / 2) * 0x8000)
        j.set_axis(pyvjoy.HID_USAGE_X, xValue)
    if 'leftPadY' in state:
        yValue = int(((state['leftPadY']  + 1) / 2) * 0x8000)
        j.set_axis(pyvjoy.HID_USAGE_Y, yValue)

    if 'A' in state:  
        j.set_button(1, state['A'])
    if 'B' in state:  
        j.set_button(2, state['B'])
    if 'X' in state:  
        j.set_button(3, state['X'])
    if 'Y' in state:  
        j.set_button(4, state['Y'])

@api.route('/command')
class Command(Resource):
    @api.expect(command_parser)
    def post(self):
        try:
            args = command_parser.parse_args()
            print(args['command'])
        except:
            traceback.print_exc()

@api.route('/controller')
class Controller(Resource):
    def get(self):
        args = controller_id_parser.parse_args()
        if args.id:
            try:
                print("Attempting to reaquire controller with id '{}'"
                    .format(args.id))
                return controllers[args.id]
            except KeyError:
                print("Couldn't reaquire controller, creating new") 
        _id = 1
        existing_ids = controllers.keys()
        while _id in existing_ids:
            _id += 1
        print('Registering controller with id: {}'.format(_id))
        controllers[_id] = createController(_id)
        if len(controllers) > MAX_CONTROLLERS:
            del controllers[controllers.keys()[0]] 
        print('Registered controller with id: {}'.format(_id))
        return {
            'id': _id
        }

    @api.expect(controller_id_parser)
    def delete(self):
        try:
            args = controller_id_parser.parse_args()
            print('Unregistering controller with id {}'.format(args.id))
            deleteController(args.id)
            print('Unregistered controller with id {}'.format(args.id))
        except KeyError:
            return 'Controller not found', 404
        except:
            traceback.print_exc()

    def put(self):
        try:
            data = request.json
            updateState(data['id'], data['state'])
            print(request.json)
        except KeyError:
            print('ERROR: Controller not found')
            return 'Controller not found', 404
        except:
            traceback.print_exc()

def cleanup():
    for k in controllers.keys():
        deleteController(k)

atexit.register(cleanup)

app.run(debug=True, host='0.0.0.0')