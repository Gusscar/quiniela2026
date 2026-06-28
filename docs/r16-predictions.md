# Predicciones Dieciseisavos de Final

## Cambios realizados

### `/predictions` page
- Se oculta la vista de Fase de Grupos (tabs A-L y partidos de grupos)
- Se muestra la vista de Dieciseisavos como pantalla principal
- Si no hay partidos R16 en la DB → mensaje "próximamente"
- Cuando el admin cargue los partidos R16 → aparecen automáticamente

### Cómo cargar los partidos R16 en Supabase
Los partidos de Dieciseisavos deben insertarse en la tabla `matches` con:
- `group_letter = NULL` (los distingue de la fase de grupos)
- `status = 'scheduled'` o `'pending'`
- `teama_id` y `teamb_id` con los IDs de los equipos clasificados
- `datetime` con la fecha y hora del partido

### Lo que NO se modificó
- Rankings → sin cambios
- Vs amigos (compare) → sin cambios
- Datos existentes de predicciones de grupos → sin cambios
- Sistema de puntaje → sin cambios

## Pendiente
- Cargar los 16 partidos en la DB desde el panel de admin
- Definir la fecha límite de predicciones para R16
