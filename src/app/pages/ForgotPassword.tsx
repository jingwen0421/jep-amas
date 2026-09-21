import {
useState
} from "react";

import {
supabase
} from "../lib/supabase";

import { useLanguage } from "../context/LanguageContext";


export default function ForgotPassword(){

const { t } = useLanguage();

const [email,setEmail]=useState("");

const [loading,setLoading]=useState(false);



async function sendReset(){

if(!email){

alert(t('forgotPassword.error.enterEmail'));

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
t('forgotPassword.success')
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

{t('forgotPassword.title')}

</h1>



<input

type="email"

placeholder={t('forgotPassword.emailPlaceholder')}

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
t('forgotPassword.sending')
:
t('forgotPassword.sendLink')
}

</button>



</div>


</div>

);


}
