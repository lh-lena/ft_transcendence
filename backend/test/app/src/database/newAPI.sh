#!/bin/bash

echo "Enter new API/Schema name:"
read table_name;


#newPrefix=$( ls migrations | grep -E '^[0-9]{3}_.+\.sql$' | sort -r | head -n 1 | cut -d '_' -f 1 )
#if [ -z "${newPrefix}" ]; then
#    newPrefix="001"
#else
#    newPrefix=$(printf "%03d" $((10#${newPrefix} + 1)))
#fi

NEWAPI="${table_name,,}"
FILENAME="${NEWAPI}.sql"
SCHEMAPATH="migrations/${FILENAME}"
TDIR="template"
NEWDIR="${NEWAPI}"

if [ -d "${NEWAPI}" ]; then
    echo "Schema '${NEWAPI}' already exists"
    exit 1
fi

#echo "Create new Schema '${SCHEMAPATH}'"
#read newSchema
#
#if [[ "${newSchema}" == "y" ]]; then
#
#echo "CREATE TABLE IF NOT EXISTS ${NEWAPI} (" > "${SCHEMAPATH}"
#echo "id INTEGER PRIMARY KEY AUTOINCREMENT," >> "${SCHEMAPATH}" 
#echo "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," >> "${SCHEMAPATH}"
#
#while true; do
#	echo -e "\e[43mAdd another column (y)?\e[0m"
#	read add;
#
#	if [[ "${add}" != 'y' ]]; then
#		break;
#	fi
#
#	echo "Column name:"
#	read column_name;
#	
#	column_name="${column_name,,}"
#
#	echo "Column type (e.g., TEXT, INTEGER):"
#	read column_type;
#	 
#	column_type="${column_type^^}"
#
#	constraints=()
#
#	echo "NOT NULL, means must be set at creation time (y)?"
#	read not_null;
#
#	[[ ${not_null} == "y" ]] && constraints+=("NOT NULL")
#
#	echo "Unique, means must be unique (y/n)?"
#	read unique;
#
#	[[ ${unique} == "y" ]] && constraints+=("UNIQUE")
#
#	echo "add an Default value (y):"
#	read default_value;
#	if [[ "${default_value}" == "y" ]]; then
#		echo "Default value (Boolean 0 or 1):"
#		read default_value;
#		constraints+=("DEFAULT ${default_value}")
#	fi
#
#	echo "${column_name} ${column_type} ${constraints[*]},"
#	echo -e "\e[43madd column? (y)?\e[0m"
#
#	read add_column;
#	if [[ "${add_column}" == "y" ]]; then
#		echo "${column_name} ${column_type} ${constraints[*]}," >> "${SCHEMAPATH}"
#	fi
#
#done
#
#echo "Current schema:"
#cat "${SCHEMAPATH}"
#
#while true; do
#
#	echo -e "\e[43madd a foreign key? (y)?\e[0m"
#	read foreign_key;
#	
#	if [[ "${foreign_key}" != "y" ]]; then
#		break;
#	fi
#		
#	echo "column which is a foreign key:"
#	read column_name;
#
#	echo "Foreign key table name:"
#	read foreign_table;
#
#	echo "Foreign key column name:"
#	read foreign_column;
#
#	fk_constraint="FOREIGN KEY (${column_name}) REFERENCES ${foreign_table}(${foreign_column})"
#	echo "Add ON DELETE action? (y):"
#	read on_delete
#	
#	if [[ "$on_delete" = "y" ]]; then
#		echo "ON DELETE action (CASCADE/SET NULL/NO ACTION/RESTRICT/IGNORE):"
#		read on_delete
#	    	fk_constraint+=" ON DELETE $on_delete"
#	fi
#	
#	echo "Add ON UPDATE action? (y):"
#	read on_update
#	
#	if [[ "$on_update" == "y" ]]; then
#	    echo "ON UPDATE action (CASCADE/SET NULL/NO ACTION/RESTRICT/IGNORE):"
#	    fk_constraint+=" ON UPDATE $on_update"
#	fi
#
#	echo "Foreign key constraint: ${fk_constraint} add? (y)"
#	read add_fk
#	if [[ "${add_fk}" != "y" ]]; then
#		echo "${fk_constraint}," >> "${SCHEMAPATH}"
#	fi
#done
#
#
#sed -i -e '$ s/,$//' ${SCHEMAPATH}
#
#echo ");" >> "${SCHEMAPATH}"
#
#echo "added schema:"
#cat "${SCHEMAPATH}"
#
#echo "create schema? (y/n) "
#
#read y;
#
#if [[ "${y}" != "y" ]]; then
#	rm "${SCHEMAPATH}"
#	exit 1;
#fi
#
#fi

echo "Creating new API directory: ${NEWDIR}? (y)"
read create_dir
if [[ "${create_dir}" != "y" ]]; then
    echo "Directory creation aborted."
    exit 1
fi
mkdir "${NEWDIR}" ||{ echo "mkdir fail"; exit 1; }

cp -r "${TDIR}/." "${NEWDIR}/." ||{ echo "copy fail"; exit 1; }

find "${NEWDIR}" -type f -exec sed -i "s/TEMPLATE/${NEWAPI}/g" {} + ||{  echo "sed fail"; exit 1; }

find ${NEWDIR} -depth -type f -name '*TEMPLATE*' | while read f; do
	mv "${f}" "${f//TEMPLATE/${NEWAPI}}"

cp "../routes/${TDIR}" "../routes/${NEWAPI}.ts" || { echo "copy route failed": exit 1; }

find "../routes/${NEWAPI}.ts" -type f -exec sed -i "s/TEMPLATE/${NEWAPI}/g" {} + || { echo "sed route fail"; exit 1; }

done
