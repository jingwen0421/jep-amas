import { useEffect, useState } from 'react';
import { initAuth } from './utils/session';


export default function App(){

const [ready,setReady]=useState(false);



useEffect(()=>{

 initAuth()
 .then(()=>{

   setReady(true);

 });


},[]);



if(!ready){

 return (

  <div className="
  min-h-screen
  flex
  items-center
  justify-center
  text-[#284342]
  ">

    Loading...

  </div>

 );

}



return null;

}