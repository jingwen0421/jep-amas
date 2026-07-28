import { supabase } from "../lib/supabase";

import {
  CRMLead,
  CRMDeal,
  CRMPayment,
  SalesPerson,
  CRMCommission
} from "../types/crm";




// =====================================================
// SALES PEOPLE
// =====================================================


export async function getSalesPeople(): Promise<SalesPerson[]> {


const {
data,
error
}= await supabase


.from("users")


.select(`
id,
full_name,
role
`)


.in(
"role",
[
"teacher",
"admin",
"owner",
"super_admin",
"internal_sales",
"external_sales"
]
)


.eq(
"status",
"active"
)


.order(
"full_name"
);



if(error)
throw error;



return data || [];

}







// =====================================================
// LEADS
// =====================================================


export async function getLeads():Promise<CRMLead[]> {


const {

data,

error

}= await supabase


.from("crm_leads")


.select(`

*,

owner:users(
id,
full_name,
role
)

`)


.order(
"created_at",
{
ascending:false
}
);



if(error)
throw error;



return data || [];

}








export async function createLead(
lead:any
){



const {

data,

error

}= await supabase


.from("crm_leads")


.insert({

name:
lead.name,


phone:
lead.phone,


source:
lead.source,


owner_id:
lead.owner_id || null,


status:
lead.status || "New",


note:
lead.note || ""

})


.select()


.single();





if(error)
throw error;



return data;

}









export async function updateLead(
id:string,
updates:any
){


const {

data,

error

}= await supabase


.from("crm_leads")


.update({

...updates,


updated_at:
new Date()
.toISOString()

})


.eq(
"id",
id
)


.select()


.single();





if(error)
throw error;



return data;

}









export async function deleteLead(
id:string
){


const {

error

}= await supabase


.from("crm_leads")


.delete()


.eq(
"id",
id
);




if(error)
throw error;



return true;

}









// =====================================================
// DEALS
// =====================================================


export async function getDeals():Promise<CRMDeal[]> {


const {

data,

error

}= await supabase


.from("crm_deals")


.select(`

*,

owner:users(
id,
full_name
)

`)


.order(
"created_at",
{
ascending:false
}
);





if(error)
throw error;



return data || [];

}









export async function createDeal(
deal:any
){


const {

data,

error

}= await supabase


.from("crm_deals")


.insert({


customer_name:
deal.customer_name,


owner_id:
deal.owner_id,


course:
deal.course,


course_type:
deal.course_type,


list_price:
Number(
deal.list_price || 0
),


final_price:
Number(
deal.final_price || 0
),


discount_pct:
Number(
deal.discount_pct || 0
),


lead_type:
deal.lead_type || "company",


signed_at:
deal.signed_at || null


})


.select()


.single();





if(error)
throw error;



return data;

}









export async function updateDeal(
id:string,
updates:any
){



const {

data,

error

}= await supabase


.from("crm_deals")


.update(updates)


.eq(
"id",
id
)


.select()


.single();





if(error)
throw error;



return data;

}









export async function deleteDeal(
id:string
){


const {

error

}= await supabase


.from("crm_deals")


.delete()


.eq(
"id",
id
);



if(error)
throw error;



return true;

}









// =====================================================
// PAYMENTS
// =====================================================


export async function addPayment(
payment:any
){



const {

data,

error

}= await supabase


.from("crm_payments")


.insert({

deal_id:
payment.deal_id,


amount:
Number(
payment.amount
),


payment_date:
payment.payment_date,


payment_type:
payment.payment_type || "Full",


installment_no:
payment.installment_no || 1

})


.select()


.single();





if(error)
throw error;



return data as CRMPayment;

}









export async function getDealPayments(
dealId:string
){


const {

data,

error

}= await supabase


.from("crm_payments")


.select("*")


.eq(
"deal_id",
dealId
)


.order(
"payment_date",
{
ascending:true
}
);





if(error)
throw error;



return data || [];

}









// =====================================================
// COMMISSION
// =====================================================


export function calculateCommission(

amount:number,

leadType:string,

discount:number

){



let rate = 5;



if(
leadType === "self"
){

rate = 7;

}






if(
amount > 15000
){

rate =
leadType==="self"
?
9
:
7;

}





if(
amount > 30000
){

rate =
leadType==="self"
?
11
:
9;

}





// discount penalty

const penalty =
Math.floor(
discount / 5
);



rate =
Math.max(
rate - penalty,
1
);





return {


rate,


amount:

amount *

rate /

100


};



}









// =====================================================
// DASHBOARD
// =====================================================


export async function getCRMDashboard(){


const [

leads,

deals,

commissions

]= await Promise.all([


supabase

.from("crm_leads")

.select(
"id,status"
),



supabase

.from("crm_deals")

.select(
"final_price"
),



supabase

.from("crm_commissions")

.select(
"commission_amount"
)



]);







const totalRevenue =

(deals.data || [])

.reduce(

(sum:any,item:any)=>

sum +

Number(
item.final_price || 0
),

0

);







const totalCommission =

(commissions.data || [])

.reduce(

(sum:any,item:any)=>

sum +

Number(
item.commission_amount || 0
),

0

);







return {


totalLeads:

leads.data?.length || 0,



activeLeads:

leads.data?.filter(

(item:any)=>

item.status !== "Lost"

).length || 0,



convertedDeals:

deals.data?.length || 0,



totalRevenue,



totalCommission


};



}