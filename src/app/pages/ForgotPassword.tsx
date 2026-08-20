import {
useState
} from "react";

import {
supabase
} from "../lib/supabase";


export default function ForgotPassword(){

const [email,setEmail]=useState("");

const [loading,setLoading]=useState(false);



async function sendReset(){

if(!email){

alert("Please enter email");

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
"Password reset email sent"
);


}



return (

<div className="
min-h-screen
bg-[#f8f8f6]
flex
items-center
justify-center
">


<div className="
bg-white
rounded-2xl
p-8
w-full
max-w-md
">


<h1 className="
text-2xl
font-semibold
text-[#284342]
mb-5
">

Forgot Password

</h1>



<input

type="email"

placeholder="Email"

value={email}

onChange={
e=>setEmail(e.target.value)
}

className="
w-full
border
rounded-lg
px-4
py-3
mb-5
"

/>



<button

disabled={loading}

onClick={sendReset}

className="
w-full
bg-[#284342]
text-[#e9da95]
py-3
rounded-lg
"

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


</div>

);


}