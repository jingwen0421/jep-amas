import {
useEffect,
useState
} from "react";


import {

Users,
Target,
Briefcase,
DollarSign,
TrendingUp,
Plus,
Search

} from "lucide-react";



import {

getLeads,
getDeals,
getSalesPeople,
getCRMDashboard
} from "../../services/crmService";




import LeadsSection from "./components/LeadsSection";
import DealsSection from "./components/DealsSection";
import TeamSection from "./components/TeamSection";
import CommissionSettingSection 
from "./components/CommissionSettingSection";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../context/LanguageContext";






type Tab =
"dashboard"
|
"leads"
|
"deals"
|
"team"
|
"commission";






export default function CRMPage(){
const { t } = useLanguage();
const [currentUser,setCurrentUser]=useState<any>(null);


const [

activeTab,

setActiveTab

]=useState<Tab>("dashboard");





const [

loading,

setLoading

]=useState(true);


async function loadCurrentUser(){

const {
data:{
user
}

}=await supabase.auth.getUser();



if(!user)
return;



const {
data,
error
}=await supabase


.from("users")

.select("*")

.eq(
"auth_user_id",
user.id
)

.maybeSingle();




if(error){

console.error(
"Load user profile error:",
error
);

return;

}



setCurrentUser(data);

console.log(
"Current CRM User:",
data
);

}



const [

leads,

setLeads

]=useState<any[]>([]);





const [

deals,

setDeals

]=useState<any[]>([]);





const [

salesPeople,

setSalesPeople

]=useState<any[]>([]);


const [
commissions,
setCommissions
]=useState<any[]>([]);




const [
dashboard,
setDashboard
]=useState<any>({

totalLeads:0,

activeLeads:0,

convertedDeals:0,

pipelineValue:0,

collectedRevenue:0,

totalCommission:0

});







async function loadCRM(){

    console.log(
"Loading CRM with user:",
currentUser
);


try{


setLoading(true);

const {
data:commissionData,
error:commissionError

}=await supabase


.from("crm_commissions")

.select("*");



if(commissionError)
throw commissionError;



setCommissions(
commissionData || []
);

const [

leadData,

dealData,

salesData,

dashboardData

]

=

await Promise.all([


getLeads(currentUser),


getDeals(currentUser),


getSalesPeople(),


getCRMDashboard(currentUser)


]);




setLeads(
leadData || []
);



setDeals(
dealData || []
);



setSalesPeople(
salesData || []
);



setDashboard(
dashboardData
);



}

catch(error){

console.error(
"CRM Load Error:",
error
);

alert(
JSON.stringify(error)
);

}


finally{

setLoading(false);

}



}







useEffect(()=>{

loadCurrentUser();

},[]);



useEffect(()=>{


if(currentUser){

loadCRM();

}


},[currentUser]);






if(loading){


return (

<div className="
p-10
text-[#284342]
text-lg
">

{t('crm.page.loading')}

</div>

);


}







return (

<div className="
space-y-8
max-w-[1400px]
mx-auto
p-6
">







<div>

<h1 className="
text-3xl
font-semibold
text-[#284342]
">

{t('crm.page.title')}

</h1>



<p className="
text-gray-500
mt-1
">

{t('crm.page.subtitle')}

</p>


</div>









<nav className="
bg-white
border
rounded-2xl
p-2
flex
gap-2
w-full
">

{

[
["dashboard",t('crm.page.tabDashboard')],

["leads",t('crm.page.tabLeads')],

["deals",t('crm.page.tabDeals')],

["team",t('crm.page.tabTeam')],

...(
[
"admin",
"super_admin"
].includes(currentUser?.role)
?
[
["commission",t('crm.page.tabCommission')]
]
:
[])

].map((item:any)=>(


<button

key={item[0]}

onClick={()=>setActiveTab(item[0])}

className={`
flex-1
px-6
py-3
rounded-xl
text-sm
font-medium
text-center
transition

${
activeTab===item[0]

?

"bg-[#284342] text-[#e9da95]"

:

"text-[#284342] hover:bg-gray-100"

}

`}

>

{item[1]}

</button>


))


}

</nav>








{
activeTab==="dashboard"

&&


<DashboardSection

data={dashboard}

deals={deals}

leads={leads}

t={t}

/>


}









{
activeTab==="leads"

&&


<LeadsSection

leads={leads}

salesPeople={salesPeople}

currentUser={currentUser}

refresh={loadCRM}

/>


}








{
activeTab==="deals"

&&

<DealsSection

deals={deals}

salesPeople={salesPeople}

currentUser={currentUser}

refresh={loadCRM}

/>


}







{
activeTab==="team"

&&



<TeamSection

salesPeople={salesPeople}

leads={leads}

deals={deals}

commissions={commissions}

currentUser={currentUser}

/>


}

{
activeTab==="commission"
&&

currentUser?.role==="super_admin"

&&

<CommissionSettingSection/>

}









</div>


);


}













// =================================================
// DASHBOARD
// =================================================



function DashboardSection({

data,

deals,

leads,

t

}:any){





const conversion =

data.totalLeads

?

(

data.convertedDeals /

data.totalLeads

*

100

).toFixed(1)

:

0;







return (

<div className="
space-y-6
">





<div className="
grid
grid-cols-1
sm:grid-cols-2
lg:grid-cols-3
xl:grid-cols-4
gap-5
">







<MetricCard

title={t('crm.dashboard.totalLeads')}

value={data.totalLeads}

icon={<Users size={22}/>}

/>





<MetricCard

title={t('crm.dashboard.activeLeads')}

value={data.activeLeads}

icon={<Target size={22}/>}

/>







<MetricCard

title={t('crm.dashboard.convertedDeals')}

value={data.convertedDeals}

icon={<Briefcase size={22}/>}

/>







<MetricCard

title={t('crm.dashboard.pipelineValue')}

value={

`RM ${Number(
data.pipelineValue || 0
).toLocaleString()}`

}

icon={<Briefcase size={22}/>}

/>

<MetricCard

title={t('crm.dashboard.collectedRevenue')}

value={

`RM ${Number(
data.collectedRevenue || 0
).toLocaleString()}`

}

icon={<DollarSign size={22}/>}

/>

<MetricCard

title={t('crm.dashboard.commission')}

value={

`RM ${Number(
data.totalCommission || 0
).toLocaleString()}`

}

icon={<TrendingUp size={22}/>}

/>


<MetricCard

title={t('crm.dashboard.conversion')}

value={`${conversion}%`}

icon={<TrendingUp size={22}/>}

/>






</div>









<div className="
grid
lg:grid-cols-2
gap-6
">






<div className="
bg-white
border
rounded-2xl
p-6
min-h-[320px]
">


<h2 className="
text-lg
font-semibold
text-[#284342]
mb-5
">

{t('crm.dashboard.recentDeals')}

</h2>





<div className="
space-y-3
">


{

deals.slice(0,5).map((deal:any)=>(


<div

key={deal.id}

className="
flex
justify-between
items-center
border-b
pb-3
"


>


<div>


<p className="
font-medium
text-[#284342]
">

{deal.customer_name}

</p>


<p className="
text-sm
text-gray-500
">

{deal.course}

</p>


</div>



<p className="
font-semibold
text-[#284342]
">

RM {deal.final_price}

</p>



</div>


))


}



</div>


</div>









<div className="
bg-white
border
rounded-2xl
p-6
min-h-[320px]
">


<h2 className="
text-lg
font-semibold
text-[#284342]
mb-5
">

{t('crm.dashboard.leadPipeline')}

</h2>





{

[

"New",

"Contacted",

"Interested",

"Demo Scheduled",

"Converted",

"Lost"

].map(status=>(



<div

key={status}

className="
flex
justify-between
py-2
border-b
"


>

<span>

{crmLeadStatusLabel(status, t)}

</span>


<span className="
font-semibold
">

{

leads.filter(

(x:any)=>

x.status===status

).length

}

</span>


</div>


))


}





</div>








</div>







</div>

);

}













function crmLeadStatusLabel(status: string, t: (key: string) => string) {
  switch (status) {
    case 'New':
      return t('crm.status.new');
    case 'Contacted':
      return t('crm.status.contacted');
    case 'Interested':
      return t('crm.status.interested');
    case 'Demo Scheduled':
      return t('crm.status.demoScheduled');
    case 'Converted':
      return t('crm.status.converted');
    case 'Lost':
      return t('crm.status.lost');
    default:
      return status;
  }
}

function MetricCard({

title,

value,

icon

}:any){



return (

<div className="
bg-white
border
rounded-2xl
p-5
">


<div className="
w-10
h-10
rounded-xl
bg-[#e9da95]/40
flex
items-center
justify-center
text-[#284342]
mb-4
">

{icon}

</div>



<p className="
text-sm
text-gray-500
">

{title}

</p>



<p className="
text-2xl
font-semibold
text-[#284342]
mt-1
">

{value}

</p>



</div>

);

}



