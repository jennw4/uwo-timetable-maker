# SCRAPER_PROMPT

Use the prompt below (paste it into an AI together with a Western timetable
screenshot and copy-paste). The AI returns one JSON object per course, which you save as
`src/data/courses/<something>.json`. The app auto-loads every `.json` in that
folder on the next build/refresh.

## Prompt

> You convert a Western University course-timetable screenshot into a single JSON
> object. Output **only** valid JSON — no commentary, no markdown fences.
>
> The screenshot has columns: **Component** (LEC/TUT/LAB/…), **Section**, **Class
> Nbr**, **Instructor**, **Requisites and Constraints**, **Days/Times/Location**,
> **Credit Units**, **Status**, **Waitlist**, **Campus**, **Delivery Type**.
>
> Produce this shape:
>
> ```json
> {
>   "code": "<course code, e.g. ECE 2238A>",
>   "name": "<course title>",
>   "term": "<Fall|Winter|Summer, if known else "">",
>   "components": [
>     {
>       "type": "<LEC|TUT|LAB|...>",
>       "sections": [
>         {
>           "section": "<e.g. 001>",
>           "classNbr": "<e.g. 9719>",
>           "instructor": "<e.g. R. Rao — copy exactly; if blank/'.'/TBA use "">",
>           "campus": "<e.g. Main>",
>           "deliveryType": "<e.g. In Person>",
>           "status": "<e.g. Not Full>",
>           "waitlist": <number or "">,
>           "meetings": [
>             { "day": "<Mo|Tu|We|Th|Fr|Sa|Su>", "start": "HH:MM", "end": "HH:MM", "location": "<room>" }
>           ]
>         }
>       ]
>     }
>   ]
> }
> ```
>
> **Rules**
> - Group sections by their **Component** value. One entry in `components` per
>   distinct component type; list every section of that type under it.
> - **Days/Times/Location often has multiple rows for one section** (e.g. a lecture
>   that meets Thu and Fri at different times/rooms). Emit **one `meetings` entry
>   per row**.
> - Convert day letters to two-letter codes: Monday→`Mo`, Tuesday→`Tu`,
>   Wednesday→`We`, Thursday→`Th`, Friday→`Fr`, Saturday→`Sa`, Sunday→`Su`.
>   (Western sometimes shows `M Tu W Th F`.)
> - Convert times to **24-hour `HH:MM`**: `1:30 PM` → `13:30`, `8:30 AM` → `08:30`,
>   `8:30 PM` → `20:30`.
> - If a section is **online/async/TBA with no time**, set `"meetings": []`.
> - `instructor` is important — it bundles a course's LEC/TUT/LAB together (the
>   chosen sections of one course must share an instructor). Copy the name exactly.
>   If the instructor cell is blank, `.`, `TBA`, or `Staff`, set it to `""` — the
>   app treats that as a wildcard that bundles with any instructor.
> - Ignore the **Requisites and Constraints** column.
> - Output JSON only. Output it as a downloadable JSON file.
> 
>
> Screenshot attached. Copy-pasted information below:
