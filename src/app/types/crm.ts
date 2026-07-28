export interface SalesPerson {


id:string;

full_name:string;

role:string;


}





export interface CRMLead {


id:string;


name:string;


phone:string;


source:string;


owner_id:string;


status:

"New"
|
"Contacted"
|
"Interested"
|
"Demo Scheduled"
|
"Converted"
|
"Lost";



note:string;



owner?:{

id:string;

full_name:string;

role:string;

};



created_at?:string;


updated_at?:string;


}







export interface CRMDeal {


id:string;


customer_name:string;


owner_id:string;


course:string;


course_type:string;


list_price:number;


final_price:number;


discount_pct:number;


lead_type:string;


signed_at:string;



owner?:{

id:string;

full_name:string;

};


created_at?:string;


}







export interface CRMPayment {


id:string;


deal_id:string;


amount:number;


payment_date:string;


payment_type:string;


installment_no:number;


created_at?:string;


}







export interface CRMCommission {


id:string;


deal_id:string;


salesperson_id:string;


commission_amount:number;


created_at?:string;


}