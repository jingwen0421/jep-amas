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

  signed_at:
  new Date()
  .toISOString()
  .substring(0,10)

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

installment_no:1,

payment_date:
new Date()
.toISOString()
.substring(0,10)

});









function calculateFinalPrice(

price:number,

discount:number

){


return Number(

price -
(price * discount / 100)

)
.toFixed(2);


}









function openAddDeal(){


setEditingDeal(null);


setDealForm(emptyDeal);


setShowDealModal(true);


}








function openEditDeal(deal:any){


setEditingDeal(deal);


setDealForm({

customer_name:
deal.customer_name,

owner_id:
deal.owner_id,

course:
deal.course,

course_type:
deal.course_type,

list_price:
Number(deal.list_price),

discount_pct:
Number(deal.discount_pct),

final_price:
Number(deal.final_price),

lead_type:
deal.lead_type,

signed_at:
deal.signed_at

});



setShowDealModal(true);


}









async function saveDeal(){


if(!dealForm.customer_name){

alert(
"Customer name is required"
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


if(
!confirm(
"Delete this deal?"
)

)

return;



await deleteDeal(id);


refresh();


}









function openPayment(deal:any){


setSelectedDeal(deal);


setPaymentForm({

amount:0,

payment_type:"Full",

installment_no:1,

payment_date:
new Date()
.toISOString()
.substring(0,10)

});


setShowPaymentModal(true);


}









async function savePayment(){


if(
!selectedDeal ||
paymentForm.amount<=0
){

alert(
"Please enter payment amount"
);

return;

}




await addPayment({

deal_id:
selectedDeal.id,

amount:
Number(paymentForm.amount),

payment_type:
paymentForm.payment_type,

installment_no:
Number(paymentForm.installment_no),

payment_date:
paymentForm.payment_date

});



setShowPaymentModal(false);


refresh();


}









async function viewPayments(deal:any){


const data =
await getDealPayments(
deal.id
);



setPayments(
data || []
);



setSelectedDeal(deal);


setShowHistoryModal(true);


}

return (

<div className="
space-y-6
">


{/* HEADER */}

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
text-sm
font-medium
"

>

<Plus size={18}/>

Add Deal

</button>


</div>









{/* DEAL TABLE */}

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
font-semibold
">

Customer

</th>



<th className="
w-[15%]
text-left
text-sm
font-semibold
">

Course

</th>



<th className="
w-[12%]
text-left
text-sm
font-semibold
">

List Price

</th>



<th className="
w-[10%]
text-left
text-sm
font-semibold
">

Discount

</th>



<th className="
w-[13%]
text-left
text-sm
font-semibold
">

Final Price

</th>



<th className="
w-[15%]
text-left
text-sm
font-semibold
">

Owner

</th>



<th className="
w-[15%]
text-center
text-sm
font-semibold
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
hover:bg-gray-50
"


>


<td className="
p-4
truncate
">

{deal.customer_name}

</td>




<td className="
truncate
">

{deal.course}

</td>





<td>

RM {Number(
deal.list_price
).toLocaleString()}

</td>





<td>

{deal.discount_pct}%

</td>





<td className="
font-semibold
">

RM {Number(
deal.final_price
).toLocaleString()}

</td>






<td>

{deal.owner?.full_name || "-"}

</td>








<td>


<div className="
flex
justify-center
gap-2
">


<button

onClick={()=>openPayment(deal)}

className="
p-2
rounded-lg
text-green-700
hover:bg-green-50
"

title="Add Payment"

>

<CreditCard size={17}/>

</button>





<button

onClick={()=>viewPayments(deal)}

className="
p-2
rounded-lg
text-blue-700
hover:bg-blue-50
"

title="Payment History"

>

<Eye size={17}/>

</button>





<button

onClick={()=>openEditDeal(deal)}

className="
p-2
rounded-lg
hover:bg-gray-100
"

title="Edit"

>

<Edit size={17}/>

</button>






<button

onClick={()=>removeDeal(deal.id)}

className="
p-2
rounded-lg
text-red-500
hover:bg-red-50
"

title="Delete"

>

<Trash2 size={17}/>

</button>


</div>


</td>





</tr>


))


}



</tbody>


</table>


</div>









{/* CREATE / EDIT DEAL MODAL */}

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


<div className="
space-y-4
">





<div>


<label className="form-label">

Customer Name

</label>


<input

className="input"

value={dealForm.customer_name}

onChange={e=>

setDealForm({

...dealForm,

customer_name:e.target.value

})

}

/>


</div>







<div>


<label className="form-label">

Owner

</label>



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

Course

</label>


<input

className="input"

value={dealForm.course}

onChange={e=>

setDealForm({

...dealForm,

course:e.target.value

})

}

/>


</div>







<div>


<label className="form-label">

Course Type

</label>


<input

className="input"

value={dealForm.course_type}

onChange={e=>

setDealForm({

...dealForm,

course_type:e.target.value

})

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







<div>


<label className="form-label">

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








<div>


<label className="form-label">

Final Price (RM)

</label>


<div className="
bg-gray-50
rounded-xl
p-3
font-semibold
text-[#284342]
">

RM {Number(
dealForm.final_price
).toLocaleString()}

</div>


</div>








<div>


<label className="form-label">

Signed Date

</label>



<input

className="input"

type="date"

value={dealForm.signed_at}

onChange={e=>

setDealForm({

...dealForm,

signed_at:e.target.value

})

}

/>


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


<div className="
space-y-4
">





<div>

<label className="form-label">

Amount (RM)

</label>



<input

className="input"

type="number"

value={paymentForm.amount}

onChange={e=>

setPaymentForm({

...paymentForm,

amount:Number(
e.target.value
)

})

}

/>


</div>








<div>

<label className="form-label">

Payment Type

</label>



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


<option value="Full">

Full Payment

</option>



<option value="Installment">

Installment

</option>



</select>


</div>








<div>

<label className="form-label">

Installment Number

</label>



<input

className="input"

type="number"

min="1"

value={paymentForm.installment_no}

onChange={e=>

setPaymentForm({

...paymentForm,

installment_no:Number(
e.target.value
)

})

}

/>


</div>







<div>

<label className="form-label">

Payment Date

</label>



<input

className="input"

type="date"

value={paymentForm.payment_date}

onChange={e=>

setPaymentForm({

...paymentForm,

payment_date:e.target.value

})

}

/>


</div>







<button

onClick={savePayment}

className="btn-primary"

>

<Save size={16}/>

Save Payment

</button>



</div>



</Modal>


}









{/* PAYMENT HISTORY */}

{

showHistoryModal &&


<Modal

title={
`Payment History - ${selectedDeal?.customer_name}`
}

close={()=>setShowHistoryModal(false)}

>



<table className="
w-full
table-fixed
">


<thead className="
bg-gray-50
">


<tr>


<th className="
p-3
text-left
">

Type

</th>


<th className="
text-left
">

Installment

</th>


<th className="
text-left
">

Amount

</th>


<th className="
text-left
">

Date

</th>


</tr>


</thead>






<tbody>


{

payments.length===0 &&

<tr>

<td

colSpan={4}

className="
p-4
text-center
text-gray-500
"

>

No payment record

</td>

</tr>


}







{

payments.map((payment:any)=>(


<tr

key={payment.id}

className="
border-t
"


>


<td className="p-3">

{payment.payment_type}

</td>




<td>

#{payment.installment_no}

</td>





<td>

RM {Number(
payment.amount
).toLocaleString()}

</td>





<td>

{payment.payment_date}

</td>





</tr>


))


}



</tbody>



</table>




</Modal>


}









</div>

);

}









// ===============================
// COMMON MODAL
// ===============================


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
p-4
">



<div className="
bg-white
rounded-2xl
p-8
w-full
max-w-xl
max-h-[90vh]
overflow-y-auto
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

className="
p-2
rounded-lg
hover:bg-gray-100
"

>

<X size={18}/>

</button>



</div>






{children}



</div>



</div>

);


}