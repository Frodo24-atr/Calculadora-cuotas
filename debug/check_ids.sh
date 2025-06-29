#!/bin/bash

# Lista de IDs extraídos de los archivos JavaScript
ids=(
    "loadingIndicator"
    "fechaInicio"
    "nombreProducto"
    "valorTotalProducto"
    "numeroCuotas"
    "listaProductos"
    "confirm-product-name"
    "modal-nombre"
    "modal-valor"
    "modal-cuotas"
    "modal-fecha"
    "resultado"
    "btnBorrarTodo"
    "gastosChart"
    "editModal"
    "confirmModal"
    "modalGenerico"
    "totalProductos"
    "valorTotal"
    "promedioMensual"
    "proximoMes"
    "statsSection"
)

echo "🔍 Verificando IDs en el archivo index.html..."
echo "================================="

for id in "${ids[@]}"; do
    if grep -q "id=\"$id\"" "index.html"; then
        echo "✅ $id - ENCONTRADO"
    else
        echo "❌ $id - NO ENCONTRADO"
    fi
done

echo ""
echo "🔍 Verificando en index_clean.html..."
echo "================================="

for id in "${ids[@]}"; do
    if grep -q "id=\"$id\"" "index_clean.html"; then
        echo "✅ $id - ENCONTRADO"
    else
        echo "❌ $id - NO ENCONTRADO"
    fi
done
