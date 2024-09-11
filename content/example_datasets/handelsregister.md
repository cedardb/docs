---
title: "JSON: German Commercial Register"
linkTitle: "JSON: German Commercial Register"
prev: /job
next: /clients
weight: 20
---

The German Commercial Register "Handelsregister" contains public register data of german companies and associations.
The official register unfortunately does not offer an API or a dump, but the Open Knowledge Foundation [published](https://offeneregister.de/)
a JSON dump with data from early 2019.
Below, you can see an example of the data:

```json lines {filename="de_companies_ocdata.jsonl"}
{"all_attributes":{"_registerArt":"HRB","_registerNummer":"150148","additional_data":{"AD":true,"CD":true,"DK":true,"HD":false,"SI":true,"UT":true,"VÖ":false},"federal_state":"Hamburg","native_company_number":"Hamburg HRB 150148","registered_office":"Hamburg","registrar":"Hamburg"},"company_number":"K1101R_HRB150148","current_status":"currently registered","jurisdiction_code":"de","name":"olly UG (haftungsbeschränkt)","officers":[{"name":"Oliver Keunecke","other_attributes":{"city":"Hamburg","firstname":"Oliver","flag":"vertretungsberechtigt gemäß allgemeiner Vertretungsregelung","lastname":"Keunecke"},"position":"Geschäftsführer","start_date":"2018-02-06","type":"person"}],"registered_address":"Waidmannstraße 1, 22769 Hamburg.","retrieved_at":"2018-11-09T18:03:03Z"}
{"all_attributes":{"_registerArt":"HRB","_registerNummer":"81092","additional_data":{"AD":true,"CD":true,"DK":true,"HD":false,"SI":true,"UT":true,"VÖ":true},"federal_state":"North Rhine-Westphalia","native_company_number":"Düsseldorf HRB 81092","registered_office":"Düsseldorf","registrar":"Düsseldorf"},"company_number":"R1101_HRB81092","current_status":"currently registered","jurisdiction_code":"de","name":"BLUECHILLED Verwaltungs GmbH","officers":[{"name":"Christof Wessels","other_attributes":{"city":"Cloppenburg","firstname":"Christof","flag":"einzelvertretungsberechtigt mit der Befugnis im Namen der Gesellschaft mit sich im eigenen Namen oder als Vertreter eines Dritten Rechtsgeschäfte abzuschließen","lastname":"Wessels"},"position":"Geschäftsführer","start_date":"2017-07-18","type":"person"},{"name":"Christof Wessels","other_attributes":{"city":"Cloppenburg","firstname":"Christof","flag":"einzelvertretungsberechtigt mit der Befugnis im Namen der Gesellschaft mit sich im eigenen Namen oder als Vertreter eines Dritten Rechtsgeschäfte abzuschließen","lastname":"Wessels"},"position":"Geschäftsführer","start_date":"2017-10-30","type":"person"}],"registered_address":"Oststr.","retrieved_at":"2018-07-25T11:14:02Z"}
{"all_attributes":{"_registerArt":"HRB","_registerNummer":"18423","additional_data":{"AD":true,"CD":true,"DK":true,"HD":true,"SI":true,"UT":true,"VÖ":true},"federal_state":"Bremen","former_registrar":"Bremen","native_company_number":"Bremen früher Bremen HRB 18423","registered_office":"Bremen","registrar":"Bremen"},"company_number":"H1101_H1101_HRB18423","current_status":"currently registered","jurisdiction_code":"de","name":"Mittelständische Beteiligungsgesellschaft Bremen mbH","officers":[{"end_date":"2009-04-17","name":"Torsten Krausen","other_attributes":{"dismissed":true,"firstname":"Torsten","lastname":"Krausen","reference_no":2},"position":"Geschäftsführer","type":"person"},{"end_date":"2012-10-19","name":"Hans-Joachim Basch","other_attributes":{"dismissed":true,"firstname":"Hans-Joachim","lastname":"Basch"},"position":"Prokurist","type":"person"},{"end_date":"2013-09-23","name":"Gerd Bauer","other_attributes":{"city":"Bremen","dismissed":true,"firstname":"Gerd","lastname":"Bauer","reference_no":3},"position":"Geschäftsführer","start_date":"2009-04-17","type":"person"},{"end_date":"2014-09-08","name":"Jörn-Michael Gauss","other_attributes":{"dismissed":true,"firstname":"Jörn-Michael","lastname":"Gauss"},"position":"Geschäftsführer","type":"person"},{"end_date":"2014-11-07","name":"Rainer Büssenschütt","other_attributes":{"dismissed":true,"firstname":"Rainer","lastname":"Büssenschütt"},"position":"Geschäftsführer","type":"person"},{"end_date":"2018-04-04","name":"Lutz Kegel","other_attributes":{"dismissed":true,"firstname":"Lutz","lastname":"Kegel","reference_no":1},"position":"Prokurist","type":"person"},{"end_date":"2018-10-08","name":"Sylvia Neumann","other_attributes":{"dismissed":true,"firstname":"Sylvia","lastname":"Neumann","reference_no":4},"position":"Prokurist","type":"person"},{"name":"Joachim Wehrkamp","other_attributes":{"city":"Thedinghausen","firstname":"Joachim","lastname":"Wehrkamp"},"position":"Geschäftsführer","start_date":"2014-09-08","type":"person"},{"name":"Jörn-Michael Gauss","other_attributes":{"city":"Bremen","firstname":"Jörn-Michael","lastname":"Gauss","reference_no":4},"position":"Geschäftsführer","start_date":"2013-09-23","type":"person"},{"name":"Sylvia Neumann","other_attributes":{"city":"Stuhr","firstname":"Sylvia","lastname":"Neumann"},"position":"Geschäftsführer","start_date":"2018-10-08","type":"person"}],"previous_names":[{"company_name":"Bremer Unternehmensbeteiligungsgesellschaft mbH"}],"registered_address":"Langenstraße 2-4, 28195 Bremen.","retrieved_at":"2018-06-24T21:12:00Z"}
```

## Data Loading

To load the data into CedarDB, you first need to download it locally:
```sh
curl -O https://daten.offeneregister.de/de_companies_ocdata.jsonl.bz2
bzip2 --decompress de_companies_ocdata.jsonl.bz2
```
{{< callout type="info" >}}
The bzip2 compressed download is about 250&nbsp;MB, which decompresses to about 4&nbsp;GB.
{{< /callout >}}

You can query the JSON file directly:
```sql
select data from cedar.csvview('de_companies_ocdata.jsonl') d(data) limit 3;
```

Or load it into CedarDB:
```sql
create table register_json (data jsonb not null);
copy register_json from 'de_companies_ocdata.jsonl';
```

## Relational Schema

A relational schema allows efficient queries on the data.
A simplified schema for the JSON data looks as follows: 

```sql
create table companies (
    company_number text primary key,
    current_status text,
    jurisdiction_code text,
    name text,
    registered_address text,
    retrieved_at text
);
create table officers (
    company_number text not null,
    name text,
    city text,
    position text,
    start_date date,
    type text
);
```

With a relational transformation, we can load the data into CedarDB:
```sql
insert into companies(company_number, current_status, jurisdiction_code, name, registered_address, retrieved_at) 
    select distinct data->>'company_number',
                    data->>'current_status', 
                    data->>'jurisdiction_code',
                    data->>'name',
                    data->>'registered_address', 
                    data->>'retrieved_at'
    from register_json;
with officers_json(company_number, officer_json) as (
    select data->>'company_number',
           json_array_elements(data->'officers')
    from register_json
    where data->'officers' is not null
)
insert into officers
    select company_number,
           officer_json->>'name',
           officer_json->'other_attributes'->>'city',
           officer_json->>'position', 
           officer_json->>'start_date',
           officer_json->>'type'
    from officers_json;
```

## Queries

Let's look for Munich's most wanted white-collar criminal
[Jan Marsalek](https://www.bka.de/DE/IhreSicherheit/Fahndungen/Personen/BekanntePersonen/Jan_Marsalek_wirecard/Sachverhalt.html).
If You See Something Say Something!

```sql
with marsalek    as (select * from officers where name = 'Jan Marsalek' and city = 'München'),
     marsalek_l1 as (select * from officers where company_number in
                        (select company_number from marsalek)),
     marsalek_l2 as (select * from officers o where exists
                        (select * from marsalek_l1 m where o.name = m.name and o.city = m.city)),
     marsalek_l3 as (select * from officers where company_number in
                        (select company_number from marsalek_l2))
select distinct name from marsalek_l3 order by name;
```

