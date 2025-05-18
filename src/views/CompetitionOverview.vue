<template>
  <div>
    <!-- 1. Подробности соревнования -->
    <div class="container mt-4">
      <div v-if="competition" class="card p-4 mb-4 shadow-sm">
        <h5 class="card-title mb-3">{{ competition.name }}</h5>
        <p>
          <strong>Организатор:</strong>
          <template v-if="competition.user">
            {{ competition.user.last_name }}
            {{ competition.user.first_name }}
            <span v-if="competition.user.middle_name">{{ competition.user.middle_name }}</span>
          </template>
          <template v-else>—</template>
        </p>
        <p><strong>Город:</strong> {{ competition.venue?.city_name || '—' }}</p>
        <p><strong>Место:</strong> {{ competition.venue?.name || '—' }}</p>
        <p><strong>Дата:</strong> {{ formatDate(competition.start_date) }}</p>
        <p>
          <strong>Статус:</strong>
          <span :class="statusClass(competition.status)">
            {{ statusText(competition.status) }}
          </span>
        </p>
        <p v-if="competition.comment">
          <strong>Комментарий:</strong> {{ competition.comment }}
        </p>
      </div>
      <div v-else class="alert alert-danger">
        Соревнование не найдено
      </div>
    </div>

    <!-- 2. Список заявок -->
    <div v-if="competition" class="container">
      <h5 class="mb-3">Заявки на участие</h5>
      <div v-if="applications.length" class="row g-3">
        <div class="col-md-4" v-for="app in applications" :key="app.id">
          <div
            class="card p-3 shadow-sm"
            style="cursor: pointer"
            @click="handleCardClick(app)"
          >
            <p>
              <strong>Тренер:</strong>
              <template v-if="app.user">
                {{ app.user.last_name }}
                {{ app.user.first_name }}
                <span v-if="app.user.middle_name">{{ app.user.middle_name }}</span>
              </template>
              <template v-else>—</template>
            </p>
            <p>
              <strong>Тип заявки:</strong>
              {{ app.request_type_id === 2 ? 'Командная' : 'Индивидуальная' }}
            </p>
            <p>
              <strong>Статус заявки:</strong>
              {{ deriveStatus(app) }}
            </p>
          </div>
        </div>
      </div>
      <div v-else class="alert alert-warning">Нет заявок.</div>
    </div>

    <!-- 3. Дочерние роуты (сетка, расписание...) -->
    <div class="container-fluid mt-4">
      <router-view />
    </div>

    <!-- 4. Модалка индивидуальной заявки -->
    <div class="modal fade" id="individualModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Детали индивидуальной заявки</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" />
          </div>
          <div class="modal-body">
            <div v-if="indPart && indUser">
              <p><strong>Фамилия:</strong> {{ indUser.last_name }}</p>
              <p><strong>Имя:</strong> {{ indUser.first_name }}</p>
              <p v-if="indUser.middle_name">
                <strong>Отчество:</strong> {{ indUser.middle_name }}
              </p>
              <p><strong>Статус:</strong> {{ indPart.status }}</p>
            </div>
            <div v-else class="alert alert-info">Загрузка…</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Модалка командной заявки -->
    <div class="modal fade" id="teamModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Состав команды</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" />
          </div>
          <div class="modal-body">
            <div v-if="coachLoading" class="alert alert-info">Загрузка тренера…</div>
            <template v-else>
              <p>
                <strong>Тренер:</strong>
                <template v-if="coach">
                  {{ coach.last_name }} {{ coach.first_name }}
                  <span v-if="coach.middle_name">{{ coach.middle_name }}</span>
                </template>
                <template v-else>—</template>
              </p>
            </template>
            <ul v-if="teamMembers.length">
              <li v-for="m in teamMembers" :key="m.id">
                {{ m.last_name }} {{ m.first_name }}
                <span v-if="m.middle_name">{{ m.middle_name }}</span> —
                {{ m.weight }} кг
              </li>
            </ul>
            <div v-else class="alert alert-warning">
              Нет участников в этой команде
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

export default {
  setup() {
    const route = useRoute();
    const compId = Number(route.params.id);

    const competition = ref(null);
    const applications = ref([]);

    // для модалок
    const indPart = ref(null);
    const indUser = ref(null);
    const teamMembers = ref([]);
    const coach = ref(null);
    const coachLoading = ref(false);

    const token = localStorage.getItem("access_token");
    const headers = { Authorization: `Bearer ${token}` };

    onMounted(async () => {
      // 1) Получаем список всех соревнований и ищем своё
      try {
        const r = await fetch("http://localhost:8000/competitions/", { headers });
        const all = await r.json();
        competition.value = all.find((c) => c.id === compId) || null;
      } catch (e) {
        console.error("Ошибка соревнований:", e);
      }

      // 2) Получаем заявки для этого соревнования
      try {
        const r = await fetch(
          `http://localhost:8000/applications/?competition_id=${compId}`,
          { headers }
        );
        applications.value = await r.json();
      } catch (e) {
        console.error("Ошибка заявок:", e);
      }
    });

    const deriveStatus = (app) => {
      if (app.request_type_id !== 2) {
        return app.individual_participants?.[0]?.status || "—";
      }
      return app.team_participants?.[0]?.status || "—";
    };

    const handleCardClick = async (app) => {
      if (app.request_type_id !== 2) {
        // Индивидуальная
        indPart.value = app.individual_participants?.[0] || null;
        if (indPart.value) {
          const u = await fetch(
            `http://localhost:8000/users/${indPart.value.user_id}`,
            { headers }
          );
          indUser.value = await u.json();
        }
        new bootstrap.Modal(document.getElementById("individualModal")).show();
      } else {
        // Командная
        teamMembers.value = app.team_participants || [];
        coach.value = null;
        coachLoading.value = true;
        if (app.team_id) {
          try {
            const tr = await fetch(
              `http://localhost:8000/teams/${app.team_id}`,
              { headers }
            );
            const team = await tr.json();
            const cr = await fetch(
              `http://localhost:8000/users/${team.coach_id}`,
              { headers }
            );
            coach.value = await cr.json();
          } catch (err) {
            console.error("Ошибка загрузки тренера:", err);
          }
        }
        coachLoading.value = false;
        new bootstrap.Modal(document.getElementById("teamModal")).show();
      }
    };

    const formatDate = (ds) => {
      const d = new Date(ds);
      return isNaN(d) ? "—" : d.toLocaleDateString("ru-RU");
    };
    const statusClass = (st) => ({
      "badge bg-primary": st === "Открыта",
      "badge bg-warning text-dark": st === "Проводится",
      "badge bg-success": st === "Завершено",
      "badge bg-secondary": true,
    });
    const statusText = (st) => {
      if (st === "Открыта") return "Заявки принимаются";
      if (st === "Проводится") return "Проводится";
      if (st === "Завершено") return "Завершено";
      return "Неизвестно";
    };

    return {
      competition,
      applications,
      indPart,
      indUser,
      teamMembers,
      coach,
      coachLoading,
      deriveStatus,
      handleCardClick,
      formatDate,
      statusClass,
      statusText,
    };
  },
};
</script>
