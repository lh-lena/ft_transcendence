
const _ResponseBase = z.object({

});

const _QuerySchema = z.object({

}).meta( { $id: _Query } );

const _ResponseSchemaArray = z.array(
  _ResponseBase
).meta( { $id: "_RespnseArray" } );

const _IdSchema = z.object({
  id:
}).meta( { $id: "_Id" } );

const _ResponseSchema = _ResponseBase.meta( { $id: "_Response" } );

const _CreateSchema = z.object({

}).meta( { $id: "_Create" } );

const _UpdateSchema = z.object({

}).meta( { $id: "_Update" } );

const _DeleteSchema = z.object({

}).meta( { $id: "_Delete" } );

export type _CreateInput = z.infer< typeof _CreateSchema >;
export type _UpdateInput = z.infer< typeof _UpdateSchema >;
export type _IdInput = z.infer< typeof _IdSchema >;
export type _QueryInput = z.infer< typeof _QuerySchema >;
export type _ResponseType = z.infer< typeof _ResponseSchema >;
export type _ResponseArrayType = z.infer< typeof _ResponseSchemaArray >;


[
  _CreateSchema,
  _UpdateSchema,
  _DeleteSchema,
  _ResponseSchema,
  _ResponseSchemaArray,
  _IdSchema,
  _QuerySchema,
]
