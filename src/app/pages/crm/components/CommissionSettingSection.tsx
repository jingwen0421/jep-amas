import {
useEffect,
useState
} from "react";


import {
Plus,
Edit,
Trash2,
X,
Save
} from "lucide-react";


import {
supabase
} from "../../../lib/supabase";
import { useLanguage } from "../../../context/LanguageContext";
import { useConfirm } from "../../../context/ConfirmDialogContext";




function getTypes(t: (key: string) => string) {
  return [

  {
  value:"rate",
  label:t('crm.commission.typeRate')
  },

  {
  value:"fixed",
  label:t('crm.commission.typeFixed')
  },

  {
  value:"kpi",
  label:t('crm.commission.typeKpi')
  }

  ];
}







export default function CommissionSettingSection(){

const { t } = useLanguage();
const confirmDialog = useConfirm();
const TYPES = getTypes(t);



const [
settings,
setSettings
]=useState<any[]>([]);




const [
showModal,
setShowModal
]=useState(false);




const [
editing,
setEditing
]=useState<any>(null);






const [
form,
setForm
]=useState({

name:"",

calculation_type:"rate",

value:0,

kpi_target:0,

active:true

});










async function load(){



const {

data,

error

}=await supabase


.from(
"crm_commission_settings"
)


.select("*")


.order(
"created_at",
{
ascending:false
}
);





if(error)
{

console.error(error);

return;

}



setSettings(
data || []
);



}









useEffect(()=>{


load();


},[]);









function openAdd(){


setEditing(null);


setForm({

name:"",

calculation_type:"rate",

value:0,

kpi_target:0,

active:true

});


setShowModal(true);


}









function openEdit(item:any){



setEditing(item);


setForm({

name:item.name,

calculation_type:
item.calculation_type,

value:
Number(item.value || 0),

kpi_target:
Number(item.kpi_target || 0),

active:
item.active

});



setShowModal(true);


}









async function save(){



if(!form.name)

{

alert(
t('crm.commission.ruleNameRequired')
);

return;

}




if(editing){



await supabase


.from(
"crm_commission_settings"
)


.update(form)


.eq(
"id",
editing.id
);



}

else{



await supabase


.from(
"crm_commission_settings"
)


.insert(form);



}




setShowModal(false);


load();


}









async function remove(id:string){



if(
!(await confirmDialog(
t('crm.commission.confirmDelete'),
{ variant: 'danger' }
))
)

return;



await supabase


.from(
"crm_commission_settings"
)


.delete()


.eq(
"id",
id
);



load();


}









async function toggle(item:any){



await supabase


.from(
"crm_commission_settings"
)


.update({

active:
!item.active

})


.eq(
"id",
item.id
);



load();


}








return (

<div className="
space-y-6
">







<div className="
flex
justify-between
items-center
">



<div>

<h2 className="
text-xl
font-semibold
text-[#284342]
">

{t('crm.commission.title')}

</h2>


<p className="
text-sm
text-gray-500
">

{t('crm.commission.subtitle')}

</p>


</div>






<button

onClick={openAdd}

className="
btn-primary
"

>

<Plus size={17}/>

{t('crm.commission.addRule')}

</button>



</div>









<div className="
bg-white
border
rounded-2xl
overflow-hidden
">



<table className="
w-full
">

<thead className="
bg-gray-50
">

<tr>


<th className="
p-4
text-left
">

{t('crm.commission.colRuleName')}

</th>


<th>

{t('crm.commission.colType')}

</th>


<th>

{t('crm.commission.colValue')}

</th>


<th>

{t('crm.commission.colKpiTarget')}

</th>


<th>

{t('payments.installments.colStatus')}

</th>


<th>

{t('crm.commission.colAction')}

</th>


</tr>

</thead>








<tbody>


{

settings.map((item:any)=>(


<tr

key={item.id}

className="
border-t
"


>


<td className="
p-4
font-medium
">

{item.name}

</td>



<td>

{

TYPES.find((type:any)=>type.value===item.calculation_type)?.label || item.calculation_type

}

</td>




<td>

{

item.calculation_type==="rate"

?

`${item.value}%`

:

`RM ${item.value}`

}

</td>





<td>

{

item.kpi_target

?

`RM ${item.kpi_target}`

:

"-"

}

</td>





<td>


<button

onClick={()=>toggle(item)}

className={`
px-3
py-1
rounded-full
text-xs

${
item.active
?
"bg-green-100 text-green-700"
:
"bg-gray-100 text-gray-500"
}

`}

>

{

item.active

?

t('crm.commission.active')

:

t('crm.commission.disabled')

}


</button>


</td>





<td>


<div className="
flex
gap-2
">


<button

onClick={()=>openEdit(item)}

className="
p-2
hover:bg-gray-100
rounded-lg
"

>

<Edit size={16}/>

</button>




<button

onClick={()=>remove(item.id)}

className="
p-2
text-red-500
hover:bg-red-50
rounded-lg
"

>

<Trash2 size={16}/>

</button>


</div>


</td>




</tr>


))


}


</tbody>


</table>


</div>













{

showModal &&


<div className="
fixed
inset-0
bg-black/30
flex
items-center
justify-center
z-50
p-4
">



<div className="
bg-white
rounded-2xl
p-8
w-full
max-w-lg
space-y-5
">





<div className="
flex
justify-between
">

<h3 className="
text-xl
font-semibold
text-[#284342]
">

{

editing
?
t('crm.commission.editRule')
:
t('crm.commission.addRule')

}

</h3>


<button

onClick={()=>setShowModal(false)}

>

<X/>

</button>


</div>








<label className="form-label">

{t('crm.commission.colRuleName')}

</label>


<input

className="input"

value={form.name}

onChange={e=>

setForm({

...form,

name:e.target.value

})

}

/>









<label className="form-label">

{t('crm.commission.calculationType')}

</label>



<select

className="input"

value={form.calculation_type}

onChange={e=>

setForm({

...form,

calculation_type:e.target.value

})

}

>


{

TYPES.map(type=>(

<option

key={type.value}

value={type.value}

>

{type.label}

</option>

))


}


</select>









<label className="form-label">

{t('crm.commission.colValue')}

</label>


<input

className="input"

type="number"

value={form.value}

onChange={e=>

setForm({

...form,

value:Number(e.target.value)

})

}

/>









{

form.calculation_type==="kpi" &&


<>

<label className="form-label">

{t('crm.commission.colKpiTarget')}

</label>


<input

className="input"

type="number"

value={form.kpi_target}

onChange={e=>

setForm({

...form,

kpi_target:Number(e.target.value)

})

}

/>


</>


}









<button

onClick={save}

className="btn-primary"

>

<Save size={16}/>

{t('crm.commission.saveRule')}

</button>





</div>


</div>


}






</div>

);


}