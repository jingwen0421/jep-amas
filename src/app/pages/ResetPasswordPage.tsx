import {
useState
} from "react";


import {
supabase
} from "../lib/supabase";



export default function ResetPasswordPage(){


const [
password,
setPassword
]=useState("");



async function updatePassword(){


const {
error
}=await supabase.auth.updateUser({

password

});



if(error){

alert(error.message);

return;

}



alert(
"Password updated"
);


window.location.href="/login";


}



return (

<div>


<h1>
Create New Password
</h1>


<input

type="password"

value={password}

onChange={
e=>setPassword(e.target.value)
}

/>



<button
onClick={updatePassword}
>

Update Password

</button>


</div>

);


}