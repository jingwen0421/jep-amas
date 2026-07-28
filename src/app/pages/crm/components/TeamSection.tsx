import {
Users,
Target,
DollarSign,
TrendingUp
} from "lucide-react";


import {
calculateCommission
} from "../../../services/crmService";




export default function TeamSection({

salesPeople,

leads,

deals

}:any){





function getStats(
person:any
){



const personLeads =

leads.filter(

(l:any)=>

l.owner_id===person.id

);






const personDeals =

deals.filter(

(d:any)=>

d.owner_id===person.id

);






const revenue =

personDeals.reduce(

(sum:number,d:any)=>

sum +

Number(
d.final_price || 0
),

0

);







const commission =

personDeals.reduce(

(sum:number,d:any)=>{


const result =

calculateCommission(

Number(
d.final_price || 0
),

d.lead_type,

Number(
d.discount_pct || 0
)

);


return sum + result.amount;


},

0

);







return {


leads:

personLeads.length,


converted:

personLeads.filter(

(x:any)=>

x.status==="Converted"

).length,



deals:

personDeals.length,


revenue,


commission


};


}









return (

<div className="
space-y-6
">





<h2 className="
text-xl
font-semibold
text-[#284342]
">

Sales Team Performance

</h2>








<div className="
grid
grid-cols-1
md:grid-cols-2
xl:grid-cols-3
gap-6
">





{

salesPeople.map((person:any)=>(



<TeamCard

key={person.id}

person={person}

stats={getStats(person)}

/>



))


}



</div>








</div>


);


}









function TeamCard({

person,

stats

}:any){



return (

<div className="
bg-white
border
rounded-2xl
p-6
space-y-5
">





<div className="
flex
items-center
gap-4
">


<div className="
w-12
h-12
rounded-full
bg-[#e9da95]/40
flex
items-center
justify-center
text-[#284342]
">

<Users/>

</div>





<div>


<h3 className="
font-semibold
text-[#284342]
">

{person.full_name}

</h3>



<p className="
text-sm
text-gray-500
">

{person.role}

</p>



</div>



</div>









<div className="
grid
grid-cols-2
gap-4
">





<Stat

icon={<Users size={18}/>}

label="Leads"

value={stats.leads}

/>






<Stat

icon={<Target size={18}/>}

label="Converted"

value={stats.converted}

/>






<Stat

icon={<TrendingUp size={18}/>}

label="Deals"

value={stats.deals}

/>







<Stat

icon={<DollarSign size={18}/>}

label="Revenue"

value={`RM ${stats.revenue.toLocaleString()}`}

/>






</div>








<div className="
border-t
pt-4
">


<p className="
text-sm
text-gray-500
">

Commission

</p>


<p className="
text-xl
font-semibold
text-[#284342]
">

RM {stats.commission.toFixed(2)}

</p>


</div>







</div>

);

}









function Stat({

icon,

label,

value

}:any){



return (

<div className="
bg-gray-50
rounded-xl
p-3
">


<div className="
text-[#284342]
mb-1
">

{icon}

</div>



<p className="
text-xs
text-gray-500
">

{label}

</p>



<p className="
font-semibold
text-[#284342]
">

{value}

</p>




</div>

);

}