import {handler} from '../../server/api.mjs';
export default async (req,context) => handler(req,context);
export const config={path:'/api/:operation'};
