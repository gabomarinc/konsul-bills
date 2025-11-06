#!/bin/bash

# Script para exportar datos de Supabase a un archivo SQL

# URL de Supabase (reemplaza con tu URL real)
SUPABASE_URL="postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# Nombre del archivo de backup
BACKUP_FILE="supabase_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "🔄 Exportando datos de Supabase..."
echo "📁 Archivo: $BACKUP_FILE"

# Exportar usando pg_dump
pg_dump "$SUPABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Exportación completada: $BACKUP_FILE"
    echo "📊 Tamaño del archivo: $(du -h $BACKUP_FILE | cut -f1)"
    echo ""
    echo "📋 Próximo paso: Importar este archivo a Neon"
    echo "   1. Ve a Neon Dashboard → SQL Editor"
    echo "   2. Haz clic en 'New query' o 'Import'"
    echo "   3. Pega el contenido de $BACKUP_FILE"
    echo "   4. Haz clic en 'Run'"
else
    echo "❌ Error al exportar. Verifica que pg_dump esté instalado."
    echo "   Instalar: brew install postgresql (macOS)"
    exit 1
fi

