var pdfjsLib = null;

var positionsAtY = {};
var pricesAtY = {};

const X_POSITIONS = [4, 5, 4, 5];
const Y_POSITIONS = [5, 4, 5, 4];

function resetData() {
    positionsAtY = {};
    pricesAtY = {};
}

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64.split(',')[1]); // Decode base64
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}


window.addEventListener("message", async function(event) {
    // Check the origin and message type for security
    if (event.source !== window || !event.data.type) return;

    if (event.data.type === "FROM_EXTENSION") {
        //console.log("Message from the extension:", event.data.data);

        pdfjsLib = globalThis.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = event.data.workerUrl;

        resetData();

        const arrayBuffer = base64ToArrayBuffer(event.data.base64data);
        //const pdfArray = event.data.blobUrl.arrayBuffer();
        try {
            //const pdf = await pdfjsLib.getDocument(event.data.pdfUrl).promise;
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            //const pdf = await pdfjsLib.getDocument(event.data.pdfData).promise;
            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                //await processPage(pageNumber, pdf); // Ensure processPage is defined
                //console.log(pageNumber);
                await processPage(pageNumber, pdf);
            }
            const headerXPos = processHeaderXPos();
            postProcessPdf(headerXPos);
        } catch (e) {
            console.error("processor error", e);
        }
        //console.log("hello");
        
        // Send a response back to the extension
        //window.postMessage({ type: "FROM_PAGE", data: "Hello from the webpage" }, "*");
    }
});

const processHeaderXPos = () => {
    
    //postProcessStrings
    //processHeaderXPos
    // Getting XPos of price & quantity headers

    const positionsAtYValues = Object.values(positionsAtY);

    const headerXPos = {
        "quantityXPos": null,
        "priceXPos": null
    }

    const quantityRegex = /^(QTY|QUANTITY|UNITS|SHIPPED|ORDERED)$/i;
    const priceRegex = /^(PRICE|NET|RRP|RETAIL|RATE|ITEM PRICE)$/i;
  
    let minimumLength = 2;

    for (let i = 0; i < positionsAtYValues.length; i++) {
        if (positionsAtYValues[i].length >= minimumLength) {
            let quantityFound = false;
            let priceFound = false;
            for (let j = 0; j < positionsAtYValues[i].length; j++) {
                if (quantityRegex.test(positionsAtYValues[i][j].item)) {

                    
                    console.log("QUANTITY FOUND");
                    console.log("here", positionsAtYValues[i][j].item);
                    console.log("here", positionsAtYValues[i][j].xPos);
                    quantityFound = true;
                    headerXPos.quantityXPos = positionsAtYValues[i][j].xPos;

                    //if (!priceFound) quantityFirst = true;
                    minimumLength = positionsAtYValues[i].length + 1;
                    console.log(positionsAtYValues[i][j].item);

                } else if (priceRegex.test(positionsAtYValues[i][j].item)) {
                    priceFound = true;

                    console.log("PRICE FOUND");
                    console.log("here", positionsAtYValues[i][j].item);
                    console.log("here", positionsAtYValues[i][j].xPos);

                    headerXPos.priceXPos = positionsAtYValues[i][j].xPos;
                    minimumLength = positionsAtYValues[i].length + 1;
                    console.log(positionsAtYValues[i][j].item);
                }
            }
            if (quantityFound && priceFound) {
                break;
            }
        }
    }

    // instead of getting quantity first etc. what do i want to get.
    //I want the x-value of the quantity and the x value of the price. 

    //console.log("Quantity First", quantityFirst);
    console.log("headerXPos", headerXPos);

    return headerXPos; 

}


async function processPage(pageNumber, pdf) {
    let page = await pdf.getPage(pageNumber);
    let rotIndex = (page.rotate / 90) % 4;
    let pageHeight = page.view[3];
  
    let textContent = await page.getTextContent({
        normalizeWhitespace: true,
    });
  
    textContent.items.forEach((item) => {
        if (item.str.trim() !== "") {
            processItem(item, pageNumber, rotIndex, pageHeight);
        }
    });
}


const isFormattedCurrencyValue = (string) => {
    const formattedValueRegex = /(?<!\d\.)(?:\(\$?|\$)?\b(?:\d{1,3}(?:,\d{3})*|\d+)\.\d{2}\b(?!\.)(?:\))?/;
    return formattedValueRegex.test(string);
}

// potentially make stricter for ints e.g. andy isaac
const isFormattedValue = (string) => {
    const formattedValueRegex = /(?<!\d\.)(?:\(\$?|\$)?\b(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?\b(?!\.)(?:\))?/;
    return formattedValueRegex.test(string);
}

const extractCurrencyValue = (valueString) => {
    const extractValue = (valueString) => {
        if (valueString.startsWith("(") && valueString.endsWith(")")) { // Handles negative numbers indicated via brackets
            valueString = valueString.slice(1, -1); 
            return parseFloat(valueString) * -1;
        }
        return parseFloat(valueString); 
    }

    const extractValueAtStart = (valueString) => {
        return extractValue(valueString.split(" ").shift().replace(/[$,]/g, "")); // Use shift() to test first split
    }

    const extractValueAtEnd = (valueString) => {
        return extractValue(valueString.split(" ").pop().replace(/[$,]/g, "")); // Use pop() to test last split
    }

    let value = extractValueAtStart(valueString);
    if (!value) value = extractValueAtEnd(valueString);
    return value; 
}

const processItem = (item, pageNumber, rotIndex, pageHeight) => {
    const adjustedXPos = item.transform[X_POSITIONS[rotIndex]];
    const adjustedYPos = Math.ceil((item.transform[Y_POSITIONS[rotIndex]] + (pageNumber - 1) * -pageHeight) / 6) * 6;

    // prices
    const isRightMostPrice = !pricesAtY[adjustedYPos] || pricesAtY[adjustedYPos].xPos < adjustedXPos;

    if (isRightMostPrice && isFormattedCurrencyValue(item.str)) {
        const value = extractCurrencyValue(item.str);
        if (!value) return;

        pricesAtY[adjustedYPos] = {
            item: value,
            xPos: adjustedXPos,
        };
    }
  
    // positions
    if (!positionsAtY[adjustedYPos]) {
        positionsAtY[adjustedYPos] = [{
            item: item.str,
            xPos: adjustedXPos,
        }];
    } else {
        positionsAtY[adjustedYPos].push({
            item: item.str,
            xPos: adjustedXPos,
        });
    }
}


function createSortedValueArray() {
    let sortedValues = Object.entries(pricesAtY)
        .sort((a, b) => b[0] - a[0]) // Sort by yPos in descending order
        .map((entry) => entry[1].item); // Extract the 'item' value
    return sortedValues;
}
  
function removeSpecificDuplicates(array) {

    return array;
    /*
    const largest = Math.max(...array);
    const lastIndex = array.lastIndexOf(largest);
    const indexes = array.reduce((acc, val, idx) => (val === largest ? [...acc, idx] : acc), []).slice(0, -1);
    let laggingIndexes = [];
    let duplicateLength = 0;
    while (indexes.length !== 0) {
        duplicateLength++;
        laggingIndexes = [...indexes];
        indexes.forEach((index, i) => {
            if (array[index - duplicateLength] !== array[lastIndex - duplicateLength]) {
                indexes.splice(i, 1); 
            }
        });
    }
    if (laggingIndexes.length === 0) {
      return array;
    } 
    laggingIndexes.sort((a, b) => b - a); 
    const finalArray = [];
    for (const laggingIndex of laggingIndexes) {
        finalArray.push(...array.slice(0, laggingIndex-duplicateLength+1), ...array.slice(laggingIndex+1));
    }
    return finalArray;*/
}
  
function findConsecutiveSums(numbers, precision = 2) {
    const results = [];
    for (let i = 0; i < numbers.length; i++) {
        let sum = 0;
        for (let j = i; j < numbers.length; j++) {
            sum += numbers[j];
            let roundedSum = Number(sum.toFixed(precision));
            if (i !== j && numbers.includes(roundedSum)) {
                results.push({ sequence: numbers.slice(i, j + 1), sum: roundedSum });
            }
        }
    }
    return results;
} 

// of t
function determineLineTotals(results, precision = 2) {
    let maxSequence = [];
    let subtotalSum;
    for (const outer of results) {
        for (const inner of results) {
            const index = inner.sequence.indexOf(outer.sum);
            if (index !== -1) {
                inner.sequence.splice(index, 1, ...outer.sequence);
            }
            if (inner.sequence.length > maxSequence.length) {
                maxSequence = inner.sequence;
                /*console.log("------");
                console.log(inner.sum)
                console.log(inner.sequence.at(-1));
                console.log(inner.sum - inner.sequence.at(-1));*/
                
                subtotalSum = Number((inner.sum - inner.sequence.at(-1)).toFixed(precision));
            }
        }
    }
    return [maxSequence, subtotalSum];
}



function findProductMatch(arr1, arr2, exactTotals, { quantityXPos, priceXPos }) {
    /*let bestMatch = {
        num1: null,
        num2: null,
        arr2index: -1,
    };*/

    bestMatch = [null, null, -1];
  
    // Pre-process arr1 to parse and round numbers
    arr1.sort((a, b) => a.xPos - b.xPos);

    /*
    const parsedArr1 = arr1
        .map((item) => {
            return parseFloat(item.item.replace(/[$,]/g, ""));
        })
        .filter((num) => !isNaN(num) && num !== 0); // Filter out invalid numbers
    */

    /*
    const parsedArr1 = arr1
        .map((item) => {

            // const regex = /(?<!\d\.)(?:\(\$?|\$)?\b(?:\d{1,3}(?:,\d{3})*|\d+)\.\d{2}\b(?!\.)(?:\))?/;
            const cleanItem = item.item.replace(/[$,]/g, "").trim(); // Replace $ and commas, then trim to remove leading/trailing spaces
            if (/^\d+(\.\d+)?$/.test(cleanItem)) { // Check if the cleaned item is a valid number using a regular expression
                return parseFloat(cleanItem);
            }
            return NaN;
        });*/

    const parsedArr1 = arr1.map((item) => {
        return isFormattedValue(item.item) ? extractCurrencyValue(item.item) : NaN;
    });


    // I do not believe invalid numbers are being filtered out properly, as seen by a date being used on Yellow Couriers. 
  
    let previousError = null;

    console.log(arr1);
    console.log(parsedArr1);

    for (let i = 0; i < parsedArr1.length; i++) {
        let num1 = parsedArr1[i];
        if (isNaN(num1) || num1 === 0) continue;
        for (let j = i + 1; j < parsedArr1.length; j++) {
            let num2 = parsedArr1[j];
      
            const productFloor = parseFloat((Math.floor(num1 * num2 * 20) / 20).toFixed(4));
            const productCeil = parseFloat((Math.ceil(num1 * num2 * 20) / 20).toFixed(4));

            //contains("****");
            console.log(productFloor);
            console.log(productCeil);
            const containsProductFloor = arr2.includes(productFloor);
            const containsProductCeil = arr2.includes(productCeil);

            if (containsProductFloor || containsProductCeil) {

                console.log("contains product is happening");

                //const arr2index = containsProductFloor ? arr2.lastIndexOf(productFloor) : arr2.lastIndexOf(productCeil);
                /* if containsProductFloor && contains */

                // if contains product floor get last index of product floor
                // if contains product ceil get last index of product ceil
                // the arr2index is the greater of the two. 
                const floorArr2Index = containsProductFloor ? arr2.lastIndexOf(productFloor) : 0;
                const ceilArr2Index = containsProductCeil ? arr2.lastIndexOf(productCeil) : 0;
                const arr2index = floorArr2Index >= ceilArr2Index ? floorArr2Index : ceilArr2Index;

                const num1XPos = arr1[i].xPos;
                const num2XPos = arr1[j].xPos;
                const quantityFirstError = Math.abs(num1XPos - quantityXPos) + Math.abs(num2XPos - priceXPos); // x-pos difference assuming quantity first
                const priceFirstError =  Math.abs(num2XPos - quantityXPos) + Math.abs(num1XPos - priceXPos); // y-pos difference assuming price first
                const quantityFirstReducesError = quantityFirstError <= priceFirstError;

                const useQuantityFirst = quantityFirstReducesError || !quantityXPos || !priceXPos;
                const currentError = useQuantityFirst ? quantityFirstError : priceFirstError;

                const quantity = useQuantityFirst ? num1 : num2;
                const price = parseFloat((exactTotals[arr2index] / quantity).toFixed(4));

                if (!previousError || currentError < previousError) {
                    bestMatch = [quantity, price, arr2index];
                    previousError = currentError;
                }
            }

            
            const bestMatchFound = bestMatch[2] !== -1;
            if (bestMatchFound) continue;

            // Handle QTY only 
            const num2Floor = parseFloat((Math.floor(num2 * 20) / 20).toFixed(4));
            const num2Ceil = parseFloat((Math.ceil(num2 * 20) / 20).toFixed(4));



            const containsNum2Floor = arr2.includes(num2Floor);
            const containsNum2Ceil = arr2.includes(num2Ceil);
            
            /*console.log("**********");
            console.log(arr2);
            console.log(num2Floor);
            console.log(num2Ceil);

            console.log("at least this is happening");
            console.log(containsNum2Floor);
            console.log(containsNum2Ceil);
            console.log(!(containsNum2Floor || containsNum2Ceil));
            console.log(!quantityXPos);*/
            
            if (!(containsNum2Floor || containsNum2Ceil) || !quantityXPos) continue;

            // need to differentiate the bottom right corner from the bulk. 
            // 



            //const arr2index = containsNum2Floor ? arr2.lastIndexOf(num2Floor) : arr2.lastIndexOf(containsNum2Ceil);
            const floorArr2Index = containsNum2Floor ? arr2.lastIndexOf(num2Floor) : 0;
            const ceilArr2Index = containsNum2Ceil ? arr2.lastIndexOf(num2Ceil) : 0;
            const arr2index = floorArr2Index >= ceilArr2Index ? floorArr2Index : ceilArr2Index;

            const determineQuantity = () => {
                for (let i = 0; i < parsedArr1.length; i++) {
                    let num1 = parsedArr1[i];
                    if (isNaN(num1) || num1 === 0) continue;
                    if (arr1[i].xPos >= quantityXPos) return num1; // maybe subtract small number from quantityXPos
                }
            }

            const quantity = determineQuantity();
            const price = parseFloat((exactTotals[arr2index] / quantity).toFixed(4));

            console.log(quantity);
            console.log(price);

            bestMatch = [quantity, price, arr2index];
            /* want to handle the cases when there is no product, but there is a quantity 
            
            
            
            
            */

            /*
            if (bestMatch.arr2index === -1 && arr2.includes(num2)) {


                /*
                // assumes first along is qty, leads to mistakes. see ultra tune invoice. 

                // incorrect qty found see true metal solutions. 

                let arr2index = arr2.lastIndexOf(num2);
                let new2 = parseFloat((num2/num1).toFixed(4));
                bestMatch = { num1, num2: new2, arr2index: arr2index };

                console.log("Parsed array", parsedArr1);
            }*/
        }
    }

    
  
    //console.log("final", bestMatch);
    //return bestMatch;
    return bestMatch;
}
  
function getRoundedArray(array) {
    return array.map((num) =>
        parseFloat((Math.round(num / 0.05) * 0.05).toFixed(2))
    ); // .reverse()
}

function determineLineTotal(array) {
    return [[Math.max(...array)], null];
}
  
const postProcessPdf = (headerXPos) => {

    const sortedArray = createSortedValueArray();
    const reducedArray = removeSpecificDuplicates(sortedArray);
    const consecutiveSums = findConsecutiveSums(reducedArray);
    let lineTotals;
    let subtotalSum;
    if (consecutiveSums.length === 0) {
        [lineTotals, subtotalSum] = determineLineTotal(reducedArray);
    } else {
        [lineTotals, subtotalSum] = determineLineTotals(consecutiveSums);
    }

    console.log(sortedArray);
    console.log(reducedArray);
    console.log(consecutiveSums);
    console.log(lineTotals);
    console.log("Subtotal sum", subtotalSum);
    console.log("--------------------------------------")

    let tax;
    let lineAmountTypes;
    if (sortedArray.indexOf(subtotalSum) !== -1) {
        console.log("Amounts are tax exclusive");
        lineAmountTypes = "Exclusive";
        tax = lineTotals.pop();
        // this generally works however, will not work if the invoice just does not have a subtotal
        // example: tutt bryant, telstra
        // solution:
        // 
    } else {
        console.log("Amounts are tax inclusive");
        lineAmountTypes = "Inclusive";
        // in this case tax might be the first item from the right not the total. 
        // will feel more confident about this if we can show subtotal + tax = total.
        // not confident about this, might need to resort to other method of finding tax. 

        // case in point: ultra tune invoice.
    }

    console.log("Line Totals:", lineTotals);
    console.log("Tax", tax);


    // First idea for determining tax

    // get the sum of all line totals excluding the last, 
    // see if that number is present within the sortedarray/reducedarray
    // if it is then it then that sum is likely the subtotal, meaning the last item is the tax
    // if it is not then otherwise.


    // may consider what position in the sortedarray the subtotal is likely to me, potentially in the preceeding 2 of the largest number.







    //const sum = lineTotals.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    //console.log("Sum", sum);

    //console.log(roundedLineTotals);



    // when I begin searching for line items again, I need to consider whether the amounts are tax inclusive vs tax exclusive.
    // there will be instances where even though the line total is tax exclusive, I should look for the line where the number includes tax.
  
    const roundedLineTotals = getRoundedArray(lineTotals);


    /*
    const positionsAtYValues = Object.values(positionsAtY);
    const positionsAtYKeys = Object.keys(positionsAtY);*/
    const positionsArray = Object.entries(positionsAtY);

    // Assuming the keys themselves are numeric values representing yPos,
    // Convert the keys to numbers for comparison and sort in descending order
    positionsArray.sort((a, b) => Number(b[0]) - Number(a[0]));

    // After sorting, extract the keys and values in this new order
    const positionsAtYKeys = positionsArray.map(entry => entry[0]);
    const positionsAtYValues = positionsArray.map(entry => entry[1]);

    console.log(positionsAtY);
    console.log(positionsAtYValues);
    //let lineItems = new Array(lineTotals.length).fill(null);
    let lineItems = [];
  
    for (let i = 0; i < positionsAtYValues.length; i++) {
        //console.log(positionsAtYValues[i]);
        var [num1, num2, arr2index] = findProductMatch(
            positionsAtYValues[i],
            roundedLineTotals,
            lineTotals,
            headerXPos
        );
        if (num1) {
            console.log("------------------");
            //console.log(values);
            console.log(`${num1} * ${num2} = ${lineTotals[arr2index]}`);

            console.log(lineTotals.length);
            console.log(lineItems.length);

            lineTotals.splice(arr2index, 1); 
            roundedLineTotals.splice(arr2index, 1); // reducing rounded will will cause it to know longer be looked for in future loops.
            // it assumes that once a match is found, it is the best possible match. 
            
            //<- should splice rounded 
            // once a match is found surely i want to remove lineTotals[arr2index]
            // then for the ones not found, I can assume qyt 1. 
            // also will want to store the y-value. 
            
            // may be overriding without comparing quality / issue with duplicate values potential.
            /*
            lineItems[arr2index] = {
                "Quantity": `${num1}`,
                "UnitAmount": `${num2}`,
                "YPos": positionsAtYKeys[i]
            }*/
            // I believe knowing the YPos will be important for determining the description later. 
           

            // it is not positionsatyvalues i want to store with it, more the y-value itself. 
            //console.log("positions at y", positionsAtYValues[i]);
            

         
            lineItems.unshift({
                "Quantity": `${num1}`,
                "UnitAmount": `${num2}`,
                "YPos": positionsAtYKeys[i]
            })
       
        }
    }




    // at this point for every null value in the lineItems, I want to assume that the quantity is 1
    // may want to take a stab at guessing the yPos too. 

    // to determine the yposition, essentially we will iterate through all of the yvalues again, finding the row that contains the value,
    // if there are multiple i need to think about how i can ensure the one with the most columns in that row is selected. 



    function findValueMatch(arr1, arr2) {

        const parsedArr1 = arr1.map((item) => {
            return isFormattedValue(item.item) ? extractCurrencyValue(item.item) : NaN;
        }).filter((num) => !isNaN(num) && num !== 0);
        
        // iterate over the numbers, checking if they are equal to the lineTotals. 

        for (let i = 0; i < parsedArr1.length; i++) {
            const roundedNumber = parseFloat((Math.round(parsedArr1[i] * 20) / 20).toFixed(4));
            const index = arr2.indexOf(roundedNumber);
            if (index !== -1) {
                return index; // return whatever it is we need to know
            }
            // apply some kind of similar rounding.
            // product = parseFloat((Math.round(num1 * num2 * 20) / 20).toFixed(4));
    
            // if a match is found return it. 
        }
    }

    console.log(roundedLineTotals);
    console.log("line items", lineItems);
      
    for (let i = 0; i < positionsAtYValues.length; i++) {
        // call a function that will check if the ypos at least contains the 
        const index = findValueMatch(positionsAtYValues[i], roundedLineTotals);
        if (index >= 0) {
            console.log("index found");

            lineItems.unshift({
                "Quantity": `1`,
                "UnitAmount": `${lineTotals[index]}`,
                //"YPos": positionsAtYKeys[i]
            })

            console.log("oh no y position set using this method, maybe its wrong here");

            lineTotals.splice(arr2index, 1); 
            roundedLineTotals.splice(arr2index, 1);
        }

        // do i want to get the first match, or look for the match with the greatest length. 

        // what is it we need to know?
        // what the number is / what index it is at. 

    }


    lineItems.sort((a, b) => parseFloat(b.YPos) - parseFloat(a.YPos));
    lineItems.forEach(lineItem => delete lineItem.YPos);

    console.log("line items", lineItems);

    window.postMessage({ type: "FROM_PAGE", data: { "LineAmountTypes": lineAmountTypes, "LineItems": lineItems } }, "*");
    

    //window.postMessage({ type: "FROM_PAGE", data: lineTotals }, "*");

    /*
    const minimum = {
        "LineItems": [
            {
              "Description": "Updated",
              "Quantity": "4",
              "UnitAmount": "100.00",
              "AccountCode": "200"
            }
        ]
    }*/
    //window.postMessage({ type: "FROM_PAGE", data: "Hello from the webpage" }, "*");
}