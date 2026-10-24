import { db } from "hatchable";
export const access = "user";
export const methods = ["GET"];
export default async function(req,res){
 const uid=String(req.user.id),date=String(req.query.date||new Date().toISOString().slice(0,10));
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({error:"Invalid date."});
 const [p,d,w,weights]=await Promise.all([
 db.query("SELECT * FROM user_profiles WHERE user_id=$1",[uid]),
 db.query("SELECT COALESCE(SUM(calories),0) calories,COALESCE(SUM(protein),0) protein,COALESCE(SUM(carbs),0) carbs,COALESCE(SUM(fat),0) fat,COALESCE(SUM(fiber),0) fiber FROM food_diary_entries WHERE user_id=$1 AND entry_date=$2",[uid,date]),
 db.query("SELECT COALESCE(SUM(amount_ml),0) total_ml FROM water_entries WHERE user_id=$1 AND entry_date=$2",[uid,date]),
 db.query("SELECT entry_date,weight_kg FROM weight_entries WHERE user_id=$1 ORDER BY entry_date DESC LIMIT 7",[uid])
 ]);
 const profile=p.rows[0]||null,totals=Object.fromEntries(Object.entries(d.rows[0]).map(([k,v])=>[k,Number(v)]));
 return res.json({date,profile,totals,calories_remaining:(profile?.calorie_target||2000)-totals.calories,water_total_ml:Number(w.rows[0].total_ml),weight_history:weights.rows});
}