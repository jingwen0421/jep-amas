import {
Users,
Target,
Briefcase,
DollarSign,
TrendingUp
} from "lucide-react";



export default function TeamSection({

salesPeople,

leads,

deals,

commissions,

currentUser

}:any){



const isAdmin =
currentUser?.role === "super_admin";




// Admin sees everyone
// Sales/Teacher sees themselves only

const displayPeople =

isAdmin

?

salesPeople.filter(
(person:any)=>
[
"teacher",
"internal_sales",
"external_sales",
"super_admin"
].includes(person.role)
)

:

salesPeople.filter(

(person:any)=>

person.id === currentUser?.id

);







function getStats(person:any){



const personLeads =

leads.filter(

(l:any)=>

l.owner_id === person.id

);




const personDeals =

deals.filter(

(d:any)=>

d.owner_id === person.id

);





const personCommission =

commissions.filter(

(c:any)=>

c.salesperson_id === person.id

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

personCommission.reduce(

(sum:number,c:any)=>

sum +

Number(
c.commission_amount || 0
),

0

);





return {


leads:

personLeads.length,



converted:

personLeads.filter(

(l:any)=>

l.status==="Converted"

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







{

displayPeople.length===0 &&


<div className="
bg-white
border
rounded-2xl
p-6
text-gray-500
">

No sales team member found.

</div>

}









<div className="
grid
grid-cols-1
md:grid-cols-2
xl:grid-cols-3
gap-6
">





{

displayPeople.map((person:any)=>(


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

<Users size={22}/>

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





<StatCard

icon={<Users size={18}/>}

label="Leads"

value={stats.leads}

/>





<StatCard

icon={<Target size={18}/>}

label="Converted"

value={stats.converted}

/>





<StatCard

icon={<Briefcase size={18}/>}

label="Deals"

value={stats.deals}

/>





<StatCard

icon={<DollarSign size={18}/>}

label="Revenue"

value={

`RM ${stats.revenue.toLocaleString()}`

}

/>





<StatCard

icon={<TrendingUp size={18}/>}

label="Commission"

value={

`RM ${stats.commission.toLocaleString()}`

}

/>




</div>





</div>

);


}









function StatCard({

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
mb-2
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