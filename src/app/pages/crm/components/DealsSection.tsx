import {
  useState
} from "react";

import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  CreditCard,
  Eye
} from "lucide-react";


import {
  createDeal,
  updateDeal,
  deleteDeal,
  addPayment,
  getDealPayments
} from "../../../services/crmService";



const emptyDeal = {

customer_name:"",
owner_id:"",
course:"",
course_type:"",
list_price:0,
discount_pct:0,
final_price:0,
lead_type:"company",
signed_at:""

};





export default function DealsSection({

deals,

salesPeople,

refresh

}:any){



const [
showDealModal,
setShowDealModal
]=useState(false);



const [
showPaymentModal,
setShowPaymentModal
]=useState(false);



const [
showHistoryModal,
setShowHistoryModal
]=useState(false);




const [
editingDeal,
setEditingDeal
]=useState<any>(null);



const [
selectedDeal,
setSelectedDeal
]=useState<any>(null);



const [
payments,
setPayments
]=useState<any[]>([]);




const [
dealForm,
setDealForm
]=useState(emptyDeal);




const [
paymentForm,
setPaymentForm
]=useState({

amount:0,

payment_type:"Full",

installment_no:1

});








function calculateFinalPrice(

price:number,

discount:number

){

return Number(

price -
(price * discount /100)

).toFixed(2);

}









function openAddDeal(){


setEditingDeal(null);


setDealForm(emptyDeal);


setShowDealModal(true);


}









function openEditDeal(deal:any){



setEditingDeal(deal);



setDealForm({

customer_name:deal.customer_name,

owner_id:deal.owner_id,

course:deal.course,

course_type:deal.course_type,

list_price:Number(deal.list_price),

discount_pct:Number(deal.discount_pct),

final_price:Number(deal.final_price),

lead_type:deal.lead_type,

signed_at:deal.signed_at

});



setShowDealModal(true);


}








async function saveDeal(){



if(!dealForm.customer_name){

alert(
"Customer name required"
);

return;

}



if(editingDeal){


await updateDeal(

editingDeal.id,

dealForm

);


}

else{


await createDeal(

dealForm

);


}



setShowDealModal(false);


refresh();


}








async function removeDeal(id:string){


if(!confirm("Delete this deal?"))

return;



await deleteDeal(id);


refresh();


}









function openPayment(deal:any){


setSelectedDeal(deal);


setPaymentForm({

amount:0,

payment_type:"Full",

installment_no:1

});


setShowPaymentModal(true);


}








async function savePayment(){



if(paymentForm.amount<=0){

alert(
"Enter payment amount"
);

return;

}



await addPayment({

deal_id:selectedDeal.id,

amount:Number(paymentForm.amount),

payment_type:
paymentForm.payment_type,

installment_no:
Number(paymentForm.installment_no),

payment_date:

new Date()

.toISOString()

.substring(0,10)

});



setShowPaymentModal(false);


refresh();


}









async function viewPayments(deal:any){


const data=

await getDealPayments(

deal.id

);



setPayments(data || []);


setSelectedDeal(deal);


setShowHistoryModal(true);


}









return (

<div className="space-y-6">





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

Deal Management

</h2>




<button

onClick={openAddDeal}

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

Add Deal

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
p-4
text-left
w-[20%]
">

Customer

</th>


<th className="
text-left
w-[15%]
">

Course

</th>



<th className="
text-left
w-[12%]
">

Final Price

</th>



<th className="
text-left
w-[15%]
">

Owner

</th>




<th className="
text-center
w-[20%]
">

Action

</th>



</tr>


</thead>





<tbody>


{

deals.map((deal:any)=>(


<tr

key={deal.id}

className="
border-t
"


>


<td className="p-4">

{deal.customer_name}

</td>



<td>

{deal.course}

</td>



<td>

RM {deal.final_price}

</td>



<td>

{deal.owner?.full_name || "-"}

</td>





<td>


<div className="
flex
justify-center
gap-3
">


<button

onClick={()=>openPayment(deal)}

className="
p-2
rounded-lg
text-green-700
hover:bg-green-50
"

>

<CreditCard size={18}/>

</button>




<button

onClick={()=>viewPayments(deal)}

className="
p-2
rounded-lg
text-blue-700
hover:bg-blue-50
"

>

<Eye size={18}/>

</button>





<button

onClick={()=>openEditDeal(deal)}

className="
p-2
rounded-lg
hover:bg-gray-100
"

>

<Edit size={18}/>

</button>





<button

onClick={()=>removeDeal(deal.id)}

className="
p-2
rounded-lg
text-red-500
hover:bg-red-50
"

>

<Trash2 size={18}/>

</button>



</div>


</td>



</tr>


))


}



</tbody>


</table>


</div>









{/* DEAL MODAL */}


{

showDealModal &&


<Modal

title={
editingDeal
?
"Edit Deal"
:
"Create Deal"
}

close={()=>setShowDealModal(false)}

>


<div className="space-y-4">


<input

className="input"

placeholder="Customer Name"

value={dealForm.customer_name}

onChange={e=>

setDealForm({

...dealForm,

customer_name:e.target.value

})

}

/>





<select

className="input"

value={dealForm.owner_id}

onChange={e=>

setDealForm({

...dealForm,

owner_id:e.target.value

})

}

>


<option value="">

Select Owner

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






<input

className="input"

placeholder="Course"

value={dealForm.course}

onChange={e=>

setDealForm({

...dealForm,

course:e.target.value

})

}

/>







<input

className="input"

placeholder="Course Type"

value={dealForm.course_type}

onChange={e=>

setDealForm({

...dealForm,

course_type:e.target.value

})

}

/>







<div className="
grid
grid-cols-2
gap-4
">


<div className="space-y-2">

<label className="
text-sm
font-medium
text-[#284342]
">

List Price (RM)

</label>


<input

className="input"

type="number"

value={dealForm.list_price}

onChange={e=>{


const price =
Number(e.target.value);


setDealForm({

...dealForm,

list_price:price,

final_price:Number(

calculateFinalPrice(

price,

dealForm.discount_pct

)

)

});


}}

/>


</div>





<div className="space-y-2">

<label className="
text-sm
font-medium
text-[#284342]
">

Discount (%)

</label>


<input

className="input"

type="number"

value={dealForm.discount_pct}

onChange={e=>{


const discount =
Number(e.target.value);


setDealForm({

...dealForm,

discount_pct:discount,

final_price:Number(

calculateFinalPrice(

dealForm.list_price,

discount

)

)

});


}}

/>


</div>


</div>








<div className="
space-y-2
">


<label className="
text-sm
font-medium
text-[#284342]
">

Final Price (RM)

</label>



<div className="
bg-gray-50
rounded-xl
p-4
text-lg
font-semibold
text-[#284342]
">

RM {dealForm.final_price}

</div>


</div>







<button

onClick={saveDeal}

className="btn-primary"

>

<Save size={16}/>

Save Deal

</button>


</div>


</Modal>


}









{/* PAYMENT MODAL */}


{

showPaymentModal &&


<Modal

title="Add Payment"

close={()=>setShowPaymentModal(false)}

>


<div className="space-y-4">


<input

className="input"

type="number"

placeholder="Amount"

value={paymentForm.amount}

onChange={e=>

setPaymentForm({

...paymentForm,

amount:Number(e.target.value)

})

}

/>





<select

className="input"

value={paymentForm.payment_type}

onChange={e=>

setPaymentForm({

...paymentForm,

payment_type:e.target.value

})

}

>


<option>

Full

</option>


<option>

Installment

</option>


</select>





<input

className="input"

type="number"

value={paymentForm.installment_no}

onChange={e=>

setPaymentForm({

...paymentForm,

installment_no:Number(e.target.value)

})

}

/>






<button

onClick={savePayment}

className="btn-primary"

>

Save Payment

</button>


</div>


</Modal>


}









{/* HISTORY MODAL */}


{

showHistoryModal &&


<Modal

title="Payment History"

close={()=>setShowHistoryModal(false)}

>


{

payments.map((p:any)=>(


<div

key={p.id}

className="
flex
justify-between
border-b
py-3
"

>


<span>

{p.payment_type}

#{p.installment_no}

</span>


<b>

RM {p.amount}

</b>


</div>


))


}



</Modal>


}





</div>

);


}









function Modal({

title,

close,

children

}:any){


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
space-y-5
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

{title}

</h2>



<button

onClick={close}

>

<X/>

</button>


</div>



{children}


</div>


</div>

);


}