import Papa from 'papaparse';
import { parseXml } from '@rgrove/parse-xml';

// CSV Parsing
export const parseCSV = (csvString: string) => {
	return Papa.parse(csvString, { header: true });
};

// XML Parsing
export const parseXML = (xmlString: string) => {
	return parseXml(xmlString);
};

// Data transformation for PunchOutOrderMessage
export const transformPunchOutOrderMessage = async (xmlString: string) => {
	const xmlData = parseXml(xmlString);

	const transformedData = xmlData?.OrderMessage?.ItemIn?.map((item: any) => ({
		itemId: item.ItemID,
		quantity: item.Quantity,
		unitPrice: item.UnitPrice?.Money?.value,
	}));

	// Return the transformed data, ready to be inserted into the database or further processed
	return transformedData;
};
