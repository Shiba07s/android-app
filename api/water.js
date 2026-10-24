import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","DELETE"];
export default async function(req,res){
 const uid=String(req.user.id);
 if(req.method==="GET"){
  const date=String(req.query.date||new Date().toISOString().slice(0,10));
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({error:"Invalid date."});
  const r=await db.query("SELECT id,amount_ml,entry_date,created_at FROM water_entries WHERE user_id=$1 AND entry_date=$2 ORDER BY created_at DESC",[uid,date]);
  return res.json({entries:r.rows,total_ml:r.rows.reduce((s,x)=>s+Number(x.amount_ml),0),date});
 }
 if(req.method==="POST"){
  const amount=Number(req.body?.amount_ml),date=String(req.body?.entry_date||new Date().toISOString().slice(0,10));
  if(!Number.isInteger(amount)||amount<1||amount>5000||!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({error:"Amount must be 1–5000 ml and date must be valid."});
  const r=await db.query("INSERT INTO water_entries (user_id,amount_ml,entry_date) VALUES ($1,$2,$3) RETURNING id,amount_ml,entry_date,created_at",[uid,amount,date]);return res.status(201).json({entry:r.rows[0]});
 }
 const id=Number(req.query.id||req.body?.id);if(!Number.isInteger(id)||id<1)return res.status(400).json({error:"Valid entry id required."});
 const r=await db.query("DELETE FROM water_entries WHERE id=$1 AND user_id=$2 RETURNING id",[id,uid]);return r.rows.length?res.json({deleted:true}):res.status(404).json({error:"Entry not found."});
}