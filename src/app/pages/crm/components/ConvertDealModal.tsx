import {
useState
} from "react";


import {
createDeal,
updateLead
} from "../../../services/crmService";



export default function ConvertDealModal({

lead,

salesPeople,

close,

refresh

}:any){



const [

course,

setCourse

]=useState("");



const [

courseType,

setCourseType

]=useState("");



const [

price,

setPrice

]=useState(0);



const [

discount,

setDiscount

]=useState(0);







async function convert(){



const finalPrice =

price -
(price * discount /100);





await createDeal({

lead_id:lead.id,

customer_name:
lead.name,

owner_id:
lead.owner_id,

course,

course_type:
courseType,

list_price:
price,

discount_pct:
discount,

final_price:
finalPrice,

lead_type:
"company",

signed_at:
new Date()
.toISOString()
.substring(0,10)

});





await updateLead(

lead.id,

{

status:"Converted"

}

);



close();


refresh();



}









return (

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
p-8
w-full
max-w-xl
space-y-4
">



<h2 className="
text-xl
font-semibold
text-[#284342]
">

Convert Lead to Deal

</h2>





<div>

<label className="form-label">

Customer

</label>


<div className="
bg-gray-50
rounded-xl
p-3
">

{lead.name}

</div>

</div>







<div>

<label className="form-label">

Course

</label>


<input

className="input"

value={course}

onChange={e=>

setCourse(e.target.value)

}

/>


</div>







<div>

<label className="form-label">

Course Type

</label>


<input

className="input"

value={courseType}

onChange={e=>

setCourseType(e.target.value)

}

/>


</div>







<div className="
grid
grid-cols-2
gap-4
">


<div>

<label className="form-label">

List Price (RM)

</label>


<input

className="input"

type="number"

value={price}

onChange={e=>

setPrice(
Number(e.target.value)
)

}

/>


</div>





<div>

<label className="form-label">

Discount (%)

</label>


<input

className="input"

type="number"

value={discount}

onChange={e=>

setDiscount(
Number(e.target.value)
)

}

/>


</div>



</div>







<div className="
bg-gray-50
rounded-xl
p-4
">

Final Price:

<b>

RM {
price -
(price * discount /100)
}

</b>


</div>







<button

onClick={convert}

className="btn-primary"

>

Create Deal

</button>




<button

onClick={close}

className="
w-full
border
rounded-xl
py-3
"

>

Cancel

</button>




</div>


</div>

);


}