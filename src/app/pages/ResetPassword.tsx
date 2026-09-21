import {
useState
} from "react";

import {
supabase
} from "../lib/supabase";

import { useLanguage } from "../context/LanguageContext";


export default function ResetPassword(){

const { t } = useLanguage();

const [password,setPassword]=useState("");

const [loading,setLoading]=useState(false);



async function updatePassword(){


if(password.length < 8){

alert(
t('resetPassword.error.passwordLength')
);

return;

}


setLoading(true);


const {
error
}=await supabase.auth.updateUser({

password

});


setLoading(false);



if(error){

alert(error.message);

return;

}


alert(
t('resetPassword.success')
);


window.location.href="/";


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

{t('resetPassword.title')}

</h1>




<input

type="password"

placeholder={t('resetPassword.newPasswordPlaceholder')}

value={password}

onChange={
e=>setPassword(e.target.value)
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

onClick={updatePassword}

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
t('resetPassword.updating')
:
t('resetPassword.updateButton')
}

</button>



</div>


</div>


);


}
