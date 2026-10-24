import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","PUT"];
export default async function(req,res){
 const uid=String(req.user.id);
 if(req.method==="GET"){
  const r=await db.query("SELECT * FROM user_profiles WHERE user_id=$1",[uid]);
  return res.json({profile:r.rows[0]||null});
 }
 const b=req.body||{};
 const calorie=Math.round(Number(b.calorie_target??2000));
 const water=Math.round(Number(b.water_target_ml??2000));
 const age=b.age==null||b.age===""?null:Number(b.age);
 const height=b.height_cm==null||b.height_cm===""?null:Number(b.height_cm);
 const weight=b.current_weight_kg==null||b.current_weight_kg===""?null:Number(b.current_weight_kg);
 const target=b.target_weight_kg==null||b.target_weight_kg===""?null:Number(b.target_weight_kg);
 if(!Number.isFinite(calorie)||calorie<500||calorie>10000||!Number.isFinite(water)||water<250||water>10000) return res.status(400).json({error:"Enter valid calorie and water targets."});
 if(age!==null&&(!Number.isFinite(age)||age<13||age>120)) return res.status(400).json({error:"Age must be between 13 and 120."});
 if(height!==null&&(!Number.isFinite(height)||height<80||height>260)) return res.status(400).json({error:"Enter a valid height in cm."});
 if(weight!==null&&(!Number.isFinite(weight)||weight<20||weight>700)) return res.status(400).json({error:"Enter a valid weight in kg."});
 const r=await db.query("INSERT INTO user_profiles (user_id,display_name,age,height_cm,current_weight_kg,target_weight_kg,activity_level,goal,diet,units,calorie_target,protein_target,carbs_target,fat_target,water_target_ml,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now()) ON CONFLICT (user_id) DO UPDATE SET display_name=EXCLUDED.display_name,age=EXCLUDED.age,height_cm=EXCLUDED.height_cm,current_weight_kg=EXCLUDED.current_weight_kg,target_weight_kg=EXCLUDED.target_weight_kg,activity_level=EXCLUDED.activity_level,goal=EXCLUDED.goal,diet=EXCLUDED.diet,units=EXCLUDED.units,calorie_target=EXCLUDED.calorie_target,protein_target=EXCLUDED.protein_target,carbs_target=EXCLUDED.carbs_target,fat_target=EXCLUDED.fat_target,water_target_ml=EXCLUDED.water_target_ml,updated_at=now() RETURNING *",[uid,String(b.display_name||"").slice(0,80),age,height,weight,target,String(b.activity_level||"moderate"),String(b.goal||"maintain"),String(b.diet||"vegetarian"),String(b.units||"metric"),calorie,Number(b.protein_target)||100,Number(b.carbs_target)||250,Number(b.fat_target)||65,water]);
 return res.json({profile:r.rows[0]});
}