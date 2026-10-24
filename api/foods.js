import { db } from "hatchable";
export const access = "user";
export const methods = ["GET"];
export default async function(req,res){
 const q=String(req.query.q||"").trim().slice(0,80);
 const category=String(req.query.category||"").trim().slice(0,40);
 const params=[];let where=[];
 if(q){params.push("%"+q+"%");where.push("name ILIKE $"+params.length);}
 if(category&&category!=="All"){params.push(category);where.push("category=$"+params.length);}
 const sql="SELECT id,name,category,diet_type,serving_label,serving_grams,calories,protein,carbs,fat,fiber,source_label FROM foods "+(where.length?"WHERE "+where.join(" AND "):"")+" ORDER BY name LIMIT 100";
 const r=await db.query(sql,params);return res.json({foods:r.rows});
}