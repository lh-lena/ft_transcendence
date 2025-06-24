import * as UserModel from './user.model';

export async function getAllUsers( db ) {
	return UserModel.findAll( db );
}

export async function getUserById( db, id: number ) {
	return UserModel.findById( db, id );
}

//TODO add hashing here and some check logic here eg. doubles ??
export async function createUser( data: createUserInput ) {
	return UserModel.insert( db, data );
}
