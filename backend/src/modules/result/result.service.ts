import { resultCrud as resultModel } from './result.crud';
import { Prisma } from '@prisma/client';

import { NotFoundError, ConflictError } from '../../utils/error';

import { transformInput, transformOutput } from './result.helper';

import {
  resultQueryInput,
  resultIdInput,
  resultCreateInput,
  resultResponseType,
  resultResponseArrayType,
} from '../../schemas/result';

export async function getQuery(
  filters?: resultQueryInput,
): Promise<resultResponseArrayType> {
  let ret;

  if (!filters) {
    ret = await resultModel.findAll();
  } else {
    ret = await resultModel.findBy(filters);
  }
  if (!ret || ret.length === 0) {
    throw new NotFoundError('No result found');
  }

  const transformedRet = await Promise.all(
    ret.map((ret) => transformOutput(ret)),
  );

  return transformedRet;
}

export async function getById(id: resultIdInput): Promise<resultResponseType> {
  const ret = await resultModel.findById(id.id);

  if (!ret) throw new NotFoundError(`result with ${id} not found`);

  const transformedRet = await transformOutput(ret);

  return transformedRet;
}

export async function create(
  data: resultCreateInput,
): Promise<resultResponseType> {
  const prismaData = await transformInput(data);
  let ret;

  try {
    ret = await resultModel.insert(prismaData);

    if (!ret) {
      throw new NotFoundError(`result not found`);
    }

    ret = await resultModel.findById(ret.id);

    if (!ret) {
      throw new NotFoundError(`result not found`);
    }

    //const transformedRet = await transformOutput(ret);

    return ret;
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new ConflictError(`result already exists`);
    }
    throw err;
  }
}
