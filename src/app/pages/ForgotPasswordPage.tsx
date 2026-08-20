import {
useState
} from "react";

import {
supabase
} from "../lib/supabase";


export default function ForgotPasswordPage(){


const [
email,
setEmail
]=useState("");



const [
loading,
setLoading
]=useState(false);



async function sendReset(){


if(!email){

alert("Enter email");

return;

}


setLoading(true);


const {
error
}=await supabase.auth.resetPasswordForEmail(

email,

{

redirectTo:

window.location.origin +
"/reset-password"

}

);



setLoading(false);



if(error){

alert(error.message);

return;

}



alert(
"Password reset link sent"
);


}



return (

<div>


<h1>
Reset Password
</h1>


<input

value={email}

onChange={
e=>setEmail(e.target.value)
}

placeholder="Email"

/>



<button

onClick={sendReset}

>

{
loading
?
"Sending..."
:
"Send Reset Link"
}


</button>


</div>

);


}