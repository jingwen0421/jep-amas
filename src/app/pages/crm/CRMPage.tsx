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






type Tab =
"dashboard"
|
"leads"
|
"deals"
|
"team";







export default function CRMPage(){



const [

activeTab,

setActiveTab

]=useState<Tab>("dashboard");





const [

loading,

setLoading

]=useState(true);






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

dashboard,

setDashboard

]=useState<any>({

totalLeads:0,

activeLeads:0,

convertedDeals:0,

totalRevenue:0,

totalCommission:0

});







async function loadCRM(){



try{


setLoading(true);



const [

leadData,

dealData,

salesData,

dashboardData

]

=

await Promise.all([


getLeads(),

getDeals(),

getSalesPeople(),

getCRMDashboard()


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
"CRM Load Error",
error
);

}


finally{

setLoading(false);

}



}







useEffect(()=>{


loadCRM();


},[]);







if(loading){


return (

<div className="
p-10
text-[#284342]
text-lg
">

Loading CRM...

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

Sales CRM

</h1>



<p className="
text-gray-500
mt-1
">

Manage leads, deals and sales performance

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

["dashboard","Dashboard"],

["leads","Leads"],

["deals","Deals"],

["team","Team"]

].map((item:any)=>(



<button

key={item[0]}

onClick={()=>setActiveTab(item[0])}

className={`
flex-1
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

/>


}









{
activeTab==="leads"

&&


<LeadsSection

leads={leads}

salesPeople={salesPeople}

refresh={loadCRM}

/>


}








{
activeTab==="deals"

&&


<DealsSection

deals={deals}

salesPeople={salesPeople}

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

/>


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

leads

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
xl:grid-cols-5
gap-5
">







<MetricCard

title="Total Leads"

value={data.totalLeads}

icon={<Users size={22}/>}

/>





<MetricCard

title="Active Leads"

value={data.activeLeads}

icon={<Target size={22}/>}

/>







<MetricCard

title="Converted Deals"

value={data.convertedDeals}

icon={<Briefcase size={22}/>}

/>







<MetricCard

title="Revenue"

value={

`RM ${Number(
data.totalRevenue || 0
).toLocaleString()}`

}

icon={<DollarSign size={22}/>}

/>








<MetricCard

title="Conversion"

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

Recent Deals

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

Lead Pipeline

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

{status}

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

