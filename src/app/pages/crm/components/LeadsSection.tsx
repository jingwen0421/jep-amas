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
RefreshCw,
Briefcase

} from "lucide-react";



import {

createLead,
updateLead,
deleteLead

} from "../../../services/crmService";



import ConvertDealModal from "./ConvertDealModal";







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

showConvert,

setShowConvert

]=useState<any>(null);






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


const searchMatch =

lead.name

.toLowerCase()

.includes(

search.toLowerCase()

)

||

lead.phone

.includes(search);






const statusMatch =

filter==="All"

||

lead.status===filter;





return (

searchMatch

&&

statusMatch

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

className="
w-full
border
rounded-xl
pl-10
py-3
"

placeholder="
Search name or phone...
"

value={search}

onChange={e=>

setSearch(
e.target.value
)

}

/>


</div>







<select

className="
border
rounded-xl
px-4
"

value={filter}

onChange={e=>

setFilter(
e.target.value
)

}

>


<option>

All

</option>


{

STATUS.map(status=>(

<option key={status}>

{status}

</option>


))


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
hover:bg-gray-50
"


>


<td className="
p-4
truncate
">

{lead.name}

</td>





<td>

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

STATUS.map(status=>(


<option

key={status}

>

{status}

</option>


))


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





{

lead.status !== "Converted" &&


<button

onClick={()=>setShowConvert(lead)}

className="
p-2
rounded-lg
text-green-700
hover:bg-green-50
"

title="
Convert to Deal
"

>

<Briefcase size={16}/>

</button>


}







<button

onClick={()=>openEdit(lead)}

className="
p-2
rounded-lg
hover:bg-gray-100
"

title="
Edit
"

>

<Edit size={16}/>

</button>







<button

onClick={()=>remove(lead.id)}

className="
p-2
rounded-lg
text-red-500
hover:bg-red-50
"

title="
Delete
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









{/* ADD / EDIT LEAD MODAL */}



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
w-full
max-w-xl
p-8
space-y-5
">





<div className="
flex
justify-between
items-center
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

className="
p-2
hover:bg-gray-100
rounded-lg
"

>

<X size={18}/>

</button>


</div>









<div>


<label className="form-label">

Customer Name

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


</div>








<div>


<label className="form-label">

Phone

</label>



<input

className="input"

value={form.phone}

onChange={e=>

setForm({

...form,

phone:e.target.value

})

}

/>


</div>









<div>


<label className="form-label">

Lead Source

</label>



<select

className="input"

value={form.source}

onChange={e=>

setForm({

...form,

source:e.target.value

})

}

>


{

SOURCES.map(source=>(


<option

key={source}

>

{source}

</option>


))


}



</select>


</div>









<div>


<label className="form-label">

Salesperson

</label>



<select

className="input"

value={form.owner_id}

onChange={e=>

setForm({

...form,

owner_id:e.target.value

})

}

>


<option value="">

Assign Salesperson

</option>




{

salesPeople.map((person:any)=>(


<option

key={person.id}

value={person.id}

>

{person.full_name}

</option>


))


}



</select>


</div>









<div>


<label className="form-label">

Status

</label>



<select

className="input"

value={form.status}

onChange={e=>

setForm({

...form,

status:e.target.value

})

}

>


{

STATUS.map(status=>(


<option

key={status}

>

{status}

</option>


))


}



</select>


</div>









<div>


<label className="form-label">

Notes

</label>



<textarea

className="input"

rows={3}

value={form.note}

onChange={e=>

setForm({

...form,

note:e.target.value

})

}

/>


</div>









<button

onClick={save}

className="
btn-primary
"

>


<Save size={17}/>

Save Lead


</button>






</div>


</div>


}









{/* CONVERT LEAD TO DEAL */}



{

showConvert &&


<ConvertDealModal

lead={showConvert}

salesPeople={salesPeople}

close={()=>setShowConvert(null)}

refresh={refresh}

/>


}






</div>

);


}