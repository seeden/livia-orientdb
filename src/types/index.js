import { Types } from 'livia';
import RID from './RID';
import Double from './Double';
import Long from './Long';
import Linked from './Linked';

Types.RID = RID;
Types.Linked = Linked;
Types.ObjectId = Linked;
Types.Double = Double;
Types.Long = Long;

export default Types;
