import Adapter from './Adapter';
import Schema from './schemas/Schema';
import Edge from './schemas/Edge';
import Vertex from './schemas/Vertex';
import Types from './types/index';
import { Index } from 'livia';
import Collate from './constants/Collate';

// deprecated
Schema.Edge = Edge;
Schema.Vertex = Vertex;

//deprecated
export default Adapter;

//valid export
export { Schema, Types, Index, Collate, Adapter, Vertex, Edge };
