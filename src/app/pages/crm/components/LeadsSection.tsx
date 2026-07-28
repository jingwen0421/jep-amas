import {
useState
} from "react";


import {

Plus,

Edit,

Trash2,

X,

Save,

Search,

RefreshCw

} from "lucide-react";



import {

createLead,

updateLead,

deleteLead

} from "../../../services/crmService";





const STATUS=[

"New",

"Contacted",

"Interested",

"Demo Scheduled",

"Converted",

"Lost"

];



const SOURCES=[

"Company Lead",

"Self Generated",

"Walk In",

"Referral"

];






export default function LeadsSection({

leads,

salesPeople,

refresh

}:any){





const [

search,

setSearch

]=useState("");




const [

filter,

setFilter

]=useState("All");




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

phone:"",

source:"Company Lead",

owner_id:"",

status:"New",

note:""

});









function openAdd(){


setEditing(null);


setForm({

name:"",

phone:"",

source:"Company Lead",

owner_id:"",

status:"New",

note:""

});


setShowModal(true);


}










function openEdit(lead:any){



setEditing(lead);



setForm({

name:lead.name,

phone:lead.phone,

source:lead.source,

owner_id:lead.owner_id,

status:lead.status,

note:lead.note || ""

});



setShowModal(true);



}










async function save(){


if(!form.name){

alert(
"Customer name required"
);

return;

}



if(editing){



await updateLead(

editing.id,

form

);



}

else{


await createLead(

form

);



}



setShowModal(false);


refresh();



}










async function remove(id:string){



if(
!confirm(
"Delete this lead?"
)
)

return;



await deleteLead(id);


refresh();


}









async function changeStatus(

id:string,

status:string

){



await updateLead(

id,

{

status

}

);



refresh();


}









const filtered = leads.filter(

(lead:any)=>{


const matchSearch =

lead.name

.toLowerCase()

.includes(

search.toLowerCase()

)

||

lead.phone

.includes(search);



const matchStatus =

filter==="All"

||

lead.status===filter;



return (

matchSearch

&&

matchStatus

);



}

);











return (

<div className="
space-y-6
">








<div className="
flex
justify-between
items-center
">




<h2 className="
text-xl
font-semibold
text-[#284342]
">

Lead Management

</h2>





<button

onClick={openAdd}

className="
flex
items-center
gap-2
bg-[#284342]
text-[#e9da95]
px-5
py-3
rounded-xl
text-sm
font-medium
"

>

<Plus size={18}/>

Add Lead

</button>





</div>









<div className="
bg-white
border
rounded-2xl
p-4
flex
gap-4
">


<div className="
flex-1
relative
">


<Search

size={18}

className="
absolute
left-3
top-3
text-gray-400
"

/>



<input

placeholder="Search name or phone..."

value={search}

onChange={e=>

setSearch(
e.target.value
)

}

className="
w-full
border
rounded-xl
pl-10
pr-4
py-3
"

/>


</div>






<select

value={filter}

onChange={e=>

setFilter(
e.target.value
)

}

className="
border
rounded-xl
px-4
"

>


<option>

All

</option>


{

STATUS.map(s=>

<option

key={s}

>

{s}

</option>

)


}


</select>







<button

onClick={refresh}

className="
p-3
rounded-xl
hover:bg-gray-100
"

>

<RefreshCw size={18}/>

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
table-fixed
">



<thead className="
bg-gray-50
">


<tr>



<th className="
w-[20%]
p-4
text-left
text-sm
">

Customer

</th>




<th className="
w-[15%]
text-left
">

Phone

</th>





<th className="
w-[15%]
text-left
">

Source

</th>






<th className="
w-[15%]
text-left
">

Status

</th>






<th className="
w-[15%]
text-left
">

Owner

</th>






<th className="
w-[20%]
text-center
">

Action

</th>



</tr>


</thead>









<tbody>



{

filtered.map((lead:any)=>(



<tr

key={lead.id}

className="
border-t
"

>


<td className="
p-4
truncate
">

{lead.name}

</td>



<td className="
truncate
">

{lead.phone}

</td>




<td>

{lead.source}

</td>






<td>


<select

value={lead.status}

onChange={e=>

changeStatus(

lead.id,

e.target.value

)

}

className="
border
rounded-lg
px-2
py-1
text-sm
"

>


{

STATUS.map(s=>

<option

key={s}

>

{s}

</option>

)

}


</select>



</td>






<td>

{lead.owner?.full_name || "-"}

</td>






<td>


<div className="
flex
justify-center
gap-2
">



<button

onClick={()=>openEdit(lead)}

className="
p-2
rounded-lg
hover:bg-gray-100
"

>

<Edit size={16}/>

</button>







<button

onClick={()=>remove(lead.id)}

className="
p-2
rounded-lg
hover:bg-red-50
text-red-500
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
">



<div className="
bg-white
rounded-2xl
w-full
max-w-lg
p-6
space-y-4
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

"Edit Lead"

:

"Add Lead"

}

</h3>






<button

onClick={()=>setShowModal(false)}

>

<X/>

</button>


</div>







<input

placeholder="Customer Name"

value={form.name}

onChange={e=>

setForm({

...form,

name:e.target.value

})

}

className="
w-full
border
rounded-xl
p-3
"

/>






<input

placeholder="Phone"

value={form.phone}

onChange={e=>

setForm({

...form,

phone:e.target.value

})

}

className="
w-full
border
rounded-xl
p-3
"

/>






<select

value={form.source}

onChange={e=>

setForm({

...form,

source:e.target.value

})

}

className="
w-full
border
rounded-xl
p-3
"

>


{

SOURCES.map(s=>

<option key={s}>

{s}

</option>

)

}


</select>







<select

value={form.owner_id}

onChange={e=>

setForm({

...form,

owner_id:e.target.value

})

}

className="
w-full
border
rounded-xl
p-3
"

>


<option value="">

Assign Salesperson

</option>



{

salesPeople.map((p:any)=>(


<option

key={p.id}

value={p.id}

>

{p.full_name}

</option>


))


}


</select>







<select

value={form.status}

onChange={e=>

setForm({

...form,

status:e.target.value

})

}

className="
w-full
border
rounded-xl
p-3
"

>


{

STATUS.map(s=>

<option key={s}>

{s}

</option>

)


}


</select>







<textarea

placeholder="Notes"

value={form.note}

onChange={e=>

setForm({

...form,

note:e.target.value

})

}

className="
w-full
border
rounded-xl
p-3
"

/>







<button

onClick={save}

className="
flex
items-center
gap-2
bg-[#284342]
text-[#e9da95]
px-5
py-3
rounded-xl
"

>

<Save size={17}/>

Save Lead

</button>






</div>


</div>


}





</div>

);


}