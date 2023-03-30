# Kupferwork for Drawio

Some simple extensions for Drawio

## ExportAsTTL

Adds *File -> Export As -> TTL* to export current (CHOWLK) graph turtle (TTL) file, converted with CHOWLK API.

## CHOWLKFromCSV

Adds *Arrange -> Insert -> Advanced -> CSV as CHOWLK* to create a CHOWLK graph from CSV file. Each row will added as owl:NameIndividual with oject properties for every column.

Eg:

```
type,name
Fruit,Apple
```

becames:

```
ns:Fruit a owl:NamedIndividual ;
    ns:type "Fruit" ;
    ns:name "Apple" .
```

### TODO

Make it configurable ....

## Usage

Add `kupferwork.js` as external plugin into drawio.

To register in drawio webapp, see `src/main/webapp/js/diagramly/App.js`:

```js
App.pluginRegistry = {
    ...
    'kupferwork': 'plugins/kupferwork/kupferwork.js'
}

```

And call drawio with param `http://<your-drawio?p=kupferwork>`


## Dev