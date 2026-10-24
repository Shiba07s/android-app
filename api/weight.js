import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","DELETE"];
export default async function(req,res){
 const uid=String(req.user.id);
 if(req.method==="GET"){const r=await db.query("SELECT id,weight_kg,entry_date,created_at FROM weight_entries WHERE user_id=$1 ORDER BY entry_date DESC LIMIT 180",[uid]);return res.json({entries:r.rows});}
 if(req.method==="POST"){const w=Number(req.body?.weight_kg),date=String(req.body?.entry_date||new Date().toISOString().slice(0,10));if(!Number.isFinite(w)||w<20||w>700||!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({error:"Enter a valid weight and date."});const r=await db.query("INSERT INTO weight_entries (user_id,weight_kg,entry_date) VALUES ($1,$2,$3) ON CONFLICT(user_id,entry_date) DO UPDATE SET weight_kg=EXCLUDED.weight_kg RETURNING id,weight_kg,entry_date",[uid,w,date]);await db.query("UPDATE user_profiles SET current_weight_kg=$1,updated_at=now() WHERE user_id=$2",[w,uid]);return res.status(201).json({entry:r.rows[0]});}
 const id=Number(req.query.id||req.body?.id);if(!Number.isInteger(id)||id<1)return res.status(400).json({error:"Valid entry id required."});const r=await db.query("DELETE FROM weight_entries WHERE id=$1 AND user_id=$2 RETURNING id",[id,uid]);return r.rows.length?res.json({deleted:true}):res.status(404).json({error:"Entry not found."});
}