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





const TYPES = [

{
value:"rate",
label:"Rate Commission (%)"
},

{
value:"fixed",
label:"Fixed Bonus (RM)"
},

{
value:"kpi",
label:"KPI Bonus"
}

];







export default function CommissionSettingSection(){




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
"Rule name required"
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
!confirm(
"Delete this rule?"
)
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

Commission Settings

</h2>


<p className="
text-sm
text-gray-500
">

Manage sales reward calculation

</p>


</div>






<button

onClick={openAdd}

className="
btn-primary
"

>

<Plus size={17}/>

Add Rule

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

Rule Name

</th>


<th>

Type

</th>


<th>

Value

</th>


<th>

KPI Target

</th>


<th>

Status

</th>


<th>

Action

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

item.calculation_type

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

"Active"

:

"Disabled"

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
"Edit Rule"
:
"Add Rule"

}

</h3>


<button

onClick={()=>setShowModal(false)}

>

<X/>

</button>


</div>








<label className="form-label">

Rule Name

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

Calculation Type

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

TYPES.map(t=>(

<option

key={t.value}

value={t.value}

>

{t.label}

</option>

))


}


</select>









<label className="form-label">

Value

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

KPI Target

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

Save Rule

</button>





</div>


</div>


}






</div>

);


}