import { supabase } from '../lib/supabase';

export type CurrentUser = {
  id: string;
  authUserId: string;
  name: string;
  email: string;
  role: string;
};

const EMPTY_USER: CurrentUser = {
  id: '',
  authUserId: '',
  name: 'User',
  email: '',
  role: 'student',
};

let cachedUser: CurrentUser = EMPTY_USER;

let initialized = false;
let initPromise: Promise<void> | null = null;


function saveUser(user: CurrentUser) {

  localStorage.setItem(
    'userId',
    user.id
  );

  localStorage.setItem(
    'authUserId',
    user.authUserId
  );

  localStorage.setItem(
    'userName',
    user.name
  );

  localStorage.setItem(
    'userEmail',
    user.email
  );

  localStorage.setItem(
    'userRole',
    user.role
  );
}


function clearUser(){

  [
    'userId',
    'authUserId',
    'userName',
    'userEmail',
    'userRole'
  ]
  .forEach(
    key=>localStorage.removeItem(key)
  );

}


function readLocalUser(): CurrentUser {

  return {

    id:
      localStorage.getItem('userId') || '',

    authUserId:
      localStorage.getItem('authUserId') || '',

    name:
      localStorage.getItem('userName') || 'User',

    email:
      localStorage.getItem('userEmail') || '',

    role:
      localStorage.getItem('userRole') || 'student',

  };

}



async function loadCurrentProfile()
:Promise<CurrentUser>{

  const {
    data:{
      user:authUser
    }
  }
  =
  await supabase.auth.getUser();


  if(!authUser){

    return EMPTY_USER;

  }



  const {
    data:profile,
    error
  }
  =
  await supabase

    .from('users')

    .select(`
      id,
      full_name,
      email,
      role,
      status
    `)

    .eq(
      'auth_user_id',
      authUser.id
    )

    .maybeSingle();



  if(error || !profile){

    await supabase.auth.signOut();

    return EMPTY_USER;

  }



  if(profile.status !== 'active'){

    await supabase.auth.signOut();

    return EMPTY_USER;

  }



  return {

    id:profile.id,

    authUserId:authUser.id,

    name:profile.full_name,

    email:profile.email,

    role:profile.role,

  };

}




export async function initAuth(){

  if(initPromise)
    return initPromise;


  initPromise =
    (async()=>{


      cachedUser =
        await loadCurrentProfile();


      if(cachedUser.id){

        saveUser(cachedUser);

      }
      else{

        clearUser();

      }



      initialized=true;



      supabase.auth.onAuthStateChange(
        async()=>{

          cachedUser =
          await loadCurrentProfile();


          if(cachedUser.id){

            saveUser(cachedUser);

          }
          else{

            clearUser();

          }

        }
      );


    })();



  return initPromise;

}





export function getCurrentUser()
:CurrentUser{


  if(!initialized){

    return readLocalUser();

  }


  return cachedUser;

}




export function isStudent(){

 return (
   getCurrentUser().role
   ===
   'student'
 );

}




export function isAdminRole(){

 const role =
 getCurrentUser().role;


 return [

   'super_admin',
   'admin',
   'owner'

 ].includes(role);

}




export function hasRole(
 roles:string[]
){

 return roles.includes(
   getCurrentUser().role
 );

}




export async function logout(){

 await supabase.auth.signOut();

 cachedUser =
 EMPTY_USER;

 clearUser();

}