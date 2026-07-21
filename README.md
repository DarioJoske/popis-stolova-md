Popis stolova md

## Ažuriranje popisa stolova

Svaki stol je zaseban `.docx` dokument u folderu `stolovipopis`.

Format dokumenta:

- prvi red: naziv stola, npr. `Stol 1`
- ostali redovi: imena gostiju

Za lokalno osvježavanje podataka pokreni:

```bash
python3 tools/generate_tables_data.py
```

Skripta generira `tables-data.js`, koji stranica koristi za prikaz i pretragu.
