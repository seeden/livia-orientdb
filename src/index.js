import Adapter from './Adapter';
import Schema from './schemas/Schema';
import Edge from './schemas/Edge';
import Vertex from './schemas/Vertex';
import Type from './types/index';

Schema.Edge = Edge;
Schema.Vertex = Vertex;
Schema.ObjectId = Type.RID;

Adapter.Schema = Schema;
Adapter.Type = Type;

export default Adapter;