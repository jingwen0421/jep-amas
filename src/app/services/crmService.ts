import { supabase } from "../lib/supabase";

import {
CRMCommission
} from "../types/crm";


import {
CRMLead,
CRMDeal,
CRMPayment,
SalesPerson
} from "../types/crm";




// =====================================================
// SALES PEOPLE
// =====================================================


export async function getSalesPeople():Promise<SalesPerson[]>{


const {
data,
error

}=await supabase


.from("users")


.select(`
id,
full_name,
role
`)


.in(
"role",
[
"admin",
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


export async function getLeads(
currentUser:any
):Promise<CRMLead[]>{



let query:any = supabase


.from("crm_leads")


.select(`

*,

owner:users(
id,
full_name,
role
)

`);





if(
currentUser &&
currentUser.role !== "super_admin"
){


query=query.eq(
"owner_id",
currentUser.id
);


}





const {
data,
error

}=await query


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

}=await supabase


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

}=await supabase


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

}=await supabase


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



export async function getDeals(
currentUser:any
):Promise<CRMDeal[]>{



let query:any = supabase


.from("crm_deals")


.select(`


*,


owner:users(
id,
full_name,
role
)


`);







if(

currentUser &&

currentUser.role !== "super_admin"

){


query=query.eq(
"owner_id",
currentUser.id
);


}







const {
data,
error

}=await query


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

}=await supabase


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


discount_pct:
Number(
deal.discount_pct || 0
),


final_price:
Number(
deal.final_price || 0
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



// save selected commission rules

if(
data &&
deal.commission_rule_ids &&
deal.commission_rule_ids.length > 0
){


await saveDealCommissionRules(

data.id,

deal.commission_rule_ids

);


}



return data;

}












export async function updateDeal(
id:string,
updates:any
){



const {
data,
error

}=await supabase


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



// delete selected rules

await supabase

.from("crm_deal_commission_rules")

.delete()

.eq(
"deal_id",
id
);




// delete payments

await supabase

.from("crm_payments")

.delete()

.eq(
"deal_id",
id
);




// delete commissions

await supabase

.from("crm_commissions")

.delete()

.eq(
"deal_id",
id
);




// delete deal

const {
error

}=await supabase


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
// COMMISSION RULE LINKING
// =====================================================



export async function getCommissionSettings(){


const {
data,
error

}=await supabase


.from(
"crm_commission_settings"
)


.select("*")


.eq(
"active",
true
);


if(error)
throw error;



return data || [];

}









export async function saveDealCommissionRules(

dealId:string,

ruleIds:string[]

){



const records = ruleIds.map(

(ruleId)=>({

deal_id:dealId,

rule_id:ruleId

})

);





const {
data,
error

}=await supabase


.from(
"crm_deal_commission_rules"
)


.insert(records);


if(error)
throw error;



return data;

}









export async function getDealCommissionRules(

dealId:string

){



const {
data,
error

}=await supabase


.from(
"crm_deal_commission_rules"
)


.select(`

rule:crm_commission_settings(
*
)

`)


.eq(
"deal_id",
dealId
);





if(error)
throw error;



return data || [];

}

// =====================================================
// PAYMENTS
// =====================================================


export async function addPayment(

payment:any

):Promise<CRMPayment>{



const {

data,

error

}=await supabase


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







// =====================================================
// GET DEAL
// =====================================================


const {

data:deal,

error:dealError

}=await supabase


.from("crm_deals")


.select(`

owner_id,

lead_type,

discount_pct,

final_price

`)


.eq(
"id",
payment.deal_id
)


.single();





if(dealError)
throw dealError;



if(!deal)
return data;









// =====================================================
// GET SELECTED RULES ONLY
// =====================================================


const rules = await getDealCommissionRules(

payment.deal_id

);







const selectedRules = rules.map(

(item:any)=>

item.rule

);








// =====================================================
// CALCULATE
// =====================================================


const reward = calculateReward({

amount:

Number(
deal.final_price
),


leadType:

deal.lead_type,


discount:

Number(
deal.discount_pct || 0
),


settings:

selectedRules


});










// =====================================================
// SAVE COMMISSION
// =====================================================



await createCommission({

salesperson_id:

deal.owner_id,


deal_id:

payment.deal_id,


month:

new Date()

.toISOString()

.substring(0,7),



sales_amount:

Number(
deal.final_price
),



commission_rate:

reward.rate,


commission_amount:

reward.commission,


bonus_amount:

reward.bonus,


total_reward:

reward.total


});





return data;


}













// =====================================================
// PAYMENT HISTORY
// =====================================================


export async function getDealPayments(

dealId:string

){


const {

data,

error

}=await supabase


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
// COMMISSION CALCULATION
// =====================================================


export function calculateReward({

amount,

leadType,

discount,

settings

}:any){



let commission = 0;


let bonus = 0;


let rate = 0;







settings.forEach((rule:any)=>{






// RATE %

if(

rule.calculation_type==="rate"

){


const value =
Number(rule.value);



rate += value;



commission +=

amount *

value /

100;


}







// FIXED BONUS

if(

rule.calculation_type==="fixed"

){



bonus +=

Number(
rule.value
);


}







// KPI BONUS

if(

rule.calculation_type==="kpi"

){



if(

amount >=

Number(
rule.kpi_target
)

){


bonus +=

Number(
rule.value
);


}



}



});








// discount penalty

const penalty =

Math.floor(

discount / 5

);



rate = Math.max(

rate - penalty,

0

);







return {


rate,


commission,


bonus,


total:

commission + bonus


};


}












// =====================================================
// CREATE COMMISSION
// =====================================================


export async function createCommission(

commission:any

){



const {

data,

error

}=await supabase


.from("crm_commissions")


.insert({



salesperson_id:

commission.salesperson_id,


deal_id:

commission.deal_id,


month:

commission.month,


sales_amount:

commission.sales_amount,


commission_rate:

commission.commission_rate,


commission_amount:

commission.commission_amount,


bonus_amount:

commission.bonus_amount || 0,


total_reward:

commission.total_reward || 0



})


.select()


.single();






if(error)
throw error;



return data;

}












// =====================================================
// TEAM PERFORMANCE
// =====================================================


export async function getTeamPerformance(){



const {

data:users,

error

}=await supabase


.from("users")


.select(`

id,

full_name,

role

`)


.eq(
"status",
"active"
)


.in(

"role",

[

"admin",

"teacher",

"super_admin",

"internal_sales",

"external_sales"

]

);





if(error)
throw error;





const result:any[]=[];





for(const user of users || []){



const {

data:leads

}=await supabase


.from("crm_leads")


.select(
"id,status"
)


.eq(
"owner_id",
user.id
);





const {

data:deals

}=await supabase


.from("crm_deals")


.select(
"id,final_price"
)


.eq(
"owner_id",
user.id
);






const {

data:rewards

}=await supabase


.from("crm_commissions")


.select(`

commission_amount,

bonus_amount,

total_reward

`)


.eq(
"salesperson_id",
user.id
);







const revenue =

(deals || [])

.reduce(

(sum:number,item:any)=>

sum +

Number(
item.final_price || 0
),

0

);






const totalReward =

(rewards || [])

.reduce(

(sum:number,item:any)=>

sum +

Number(
item.total_reward || 0
),

0

);







result.push({


id:user.id,


name:user.full_name,


role:user.role,


leadCount:

leads?.length || 0,


converted:

leads?.filter(

(x:any)=>

x.status==="Converted"

).length || 0,



dealCount:

deals?.length || 0,


revenue,


totalReward



});



}



return result;


}












// =====================================================
// DASHBOARD
// =====================================================


export async function getCRMDashboard(

currentUser:any

){



let leadQuery:any = supabase


.from("crm_leads")


.select(
"id,status,owner_id"
);




let dealQuery:any = supabase


.from("crm_deals")


.select(
"final_price,owner_id"
);




let paymentQuery:any = supabase


.from("crm_payments")


.select(
"amount,deal_id"
);




let commissionQuery:any = supabase


.from("crm_commissions")


.select(`

commission_amount,

bonus_amount,

total_reward,

salesperson_id

`);






if(
currentUser &&
currentUser.role !== "super_admin"
){

leadQuery =
leadQuery.eq(
"owner_id",
currentUser.id
);


dealQuery =
dealQuery.eq(
"owner_id",
currentUser.id
);


commissionQuery =
commissionQuery.eq(
"salesperson_id",
currentUser.id
);


// IMPORTANT
// only payments from own deals

const {
data:userDeals
}=await supabase

.from("crm_deals")

.select("id")

.eq(
"owner_id",
currentUser.id
);


const dealIds =
(userDeals || [])
.map(
(d:any)=>d.id
);


if(dealIds.length){

paymentQuery =
paymentQuery.in(
"deal_id",
dealIds
);

}

else{

paymentQuery =
paymentQuery.eq(
"deal_id",
"00000000-0000-0000-0000-000000000000"
);

}




}






const [

leads,

deals,

payments,

commissions

]=await Promise.all([


leadQuery,


dealQuery,


paymentQuery,


commissionQuery


]);








const pipelineValue =

(deals.data || [])

.reduce(

(sum:number,item:any)=>

sum +

Number(
item.final_price || 0
),

0

);






const collectedRevenue =

(payments.data || [])

.reduce(

(sum:number,item:any)=>

sum +

Number(
item.amount || 0
),

0

);







const totalReward =

(commissions.data || [])

.reduce(

(sum:number,item:any)=>

sum +

Number(
item.total_reward || 0
),

0

);








return {


totalLeads:

leads.data?.length || 0,


activeLeads:

leads.data?.filter(

(x:any)=>

x.status!=="Lost"

).length || 0,



convertedDeals:

deals.data?.length || 0,



pipelineValue,



collectedRevenue,



totalCommission:

totalReward


};


}
