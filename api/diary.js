import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","PUT","DELETE"];
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||""));
export default async function(req,res){
 const uid=String(req.user.id);
 if(req.method==="GET"){
  const date=String(req.query.date||new Date().toISOString().slice(0,10));
  if(!validDate(date))return res.status(400).json({error:"Invalid date."});
  const r=await db.query("SELECT e.id,e.food_id,e.custom_name,e.entry_date,e.meal_type,e.quantity,e.calories,e.protein,e.carbs,e.fat,e.fiber,e.note,COALESCE(f.name,e.custom_name) AS name,COALESCE(f.serving_label,'custom serving') AS serving_label FROM food_diary_entries e LEFT JOIN foods f ON f.id=e.food_id WHERE e.user_id=$1 AND e.entry_date=$2 ORDER BY e.created_at",[uid,date]);
  const t=r.rows.reduce((a,x)=>{for(const k of ["calories","protein","carbs","fat","fiber"])a[k]+=Number(x[k]||0);return a;},{calories:0,protein:0,carbs:0,fat:0,fiber:0});
  return res.json({entries:r.rows,totals:t,date});
 }
 if(req.method==="POST"){
  const b=req.body||{},foodId=Number(b.food_id),quantity=Number(b.quantity),date=String(b.entry_date||new Date().toISOString().slice(0,10)),meal=String(b.meal_type||"Breakfast");
  if(!Number.isInteger(foodId)||foodId<1||!Number.isFinite(quantity)||quantity<=0||quantity>100||!validDate(date)||!["Breakfast","Lunch","Dinner","Snacks"].includes(meal))return res.status(400).json({error:"Choose a food, valid quantity, date, and meal."});
  const f=await db.query("SELECT * FROM foods WHERE id=$1",[foodId]);if(!f.rows.length)return res.status(404).json({error:"Food not found."});
  const x=f.rows[0],ratio=quantity;
  const r=await db.query("INSERT INTO food_diary_entries (user_id,food_id,entry_date,meal_type,quantity,calories,protein,carbs,fat,fiber,note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,food_id,entry_date,meal_type,quantity,calories,protein,carbs,fat,fiber,note",[uid,foodId,date,meal,quantity,Number(x.calories)*ratio,Number(x.protein)*ratio,Number(x.carbs)*ratio,Number(x.fat)*ratio,Number(x.fiber)*ratio,String(b.note||"").slice(0,300)]);
  return res.status(201).json({entry:{...r.rows[0],name:x.name,serving_label:x.serving_label}});
 }
 const id=Number(req.query.id||req.body?.id);
 if(!Number.isInteger(id)||id<1)return res.status(400).json({error:"Valid entry id required."});
 if(req.method==="DELETE"){const r=await db.query("DELETE FROM food_diary_entries WHERE id=$1 AND user_id=$2 RETURNING id",[id,uid]);return r.rows.length?res.json({deleted:true}):res.status(404).json({error:"Entry not found."});}
 if(req.method==="PUT"){
  const b=req.body||{},q=Number(b.quantity),meal=String(b.meal_type||"");
  if(!Number.isFinite(q)||q<=0||q>100||!["Breakfast","Lunch","Dinner","Snacks"].includes(meal))return res.status(400).json({error:"Invalid quantity or meal."});
  const old=await db.query("SELECT e.*,f.calories AS fc,f.protein AS fp,f.carbs AS fcarbs,f.fat AS ff,f.fiber AS ffiber FROM food_diary_entries e JOIN foods f ON f.id=e.food_id WHERE e.id=$1 AND e.user_id=$2",[id,uid]);
  if(!old.rows.length)return res.status(404).json({error:"Entry not found."});
  const x=old.rows[0],r=await db.query("UPDATE food_diary_entries SET quantity=$1,meal_type=$2,calories=$3,protein=$4,carbs=$5,fat=$6,fiber=$7 WHERE id=$8 AND user_id=$9 RETURNING *",[q,meal,Number(x.fc)*q,Number(x.fp)*q,Number(x.fcarbs)*q,Number(x.ff)*q,Number(x.ffiber)*q,id,uid]);
  return res.json({entry:r.rows[0]});
 }
}