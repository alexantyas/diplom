<template>
  <div>
    <!-- 1. Подробности соревнования (оставляем обычный container) -->
    <div class="container mt-4">
      <div v-if="competition" class="card p-4 mb-4 shadow-sm">
        <h5 class="card-title mb-3">{{ competition.name }}</h5>
        <p>
          <strong>Организатор:</strong>
          <template v-if="competition.user">
            {{ competition.user.last_name }}
            {{ competition.user.first_name }}
            <span v-if="competition.user.middle_name">
              {{ competition.user.middle_name }}
            </span>
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

    <!-- 2. Список заявок (тоже в обычном container) -->
    <div v-if="competition" class="container">
      <h5 class="mb-3">Заявки на участие</h5>
      <div v-if="applications.length" class="row g-3">
        <div class="col-md-4" v-for="app in applications" :key="app.id">
          <div class="card p-3 shadow-sm">
            <!-- детали заявки -->
            <div @click="handleCardClick(app)" style="cursor: pointer;">
              <p>
                <strong>
                  {{ app.request_type_id === 2 ? 'Тренер' : 'Участник' }}:
                </strong>
                <template v-if="app.request_type_id === 2">
                  {{ formatName(app.user) }}
                </template>
                <template v-else>
                  {{ app.participantUser
                    ? formatName(app.participantUser)
                    : '—' }}
                </template>
              </p>
              <p>
                <strong>Тип заявки:</strong>
                {{ app.request_type_id === 2
                  ? 'Командная'
                  : 'Индивидуальная' }}
              </p>
              <p>
                <strong>Статус заявки:</strong>
                <span
                  :class="{
                    'badge bg-secondary':
                      app.status === 'pending' &&
                      !app.isUpdating,
                    'badge bg-success':
                      app.status === 'approved' &&
                      !app.isUpdating,
                    'badge bg-danger':
                      app.status === 'rejected' &&
                      !app.isUpdating,
                    'badge bg-warning text-dark': app.isUpdating
                  }"
                >
                  <template v-if="app.isUpdating">
                    <span
                      class="spinner-border spinner-border-sm me-1"
                    ></span>
                    {{ statusMap[app.pendingStatus] }}…
                  </template>
                  <template v-else>
                    {{ statusMap[app.status] }}
                  </template>
                </span>
              </p>
            </div>

            <!-- кнопки -->
            <div class="d-flex justify-content-between mt-2">
              <button
                class="btn btn-sm btn-outline-success"
                :disabled="
                  app.status === 'approved' || app.isUpdating
                "
                @click="changeStatus(app, 'approved')"
              >
                <span
                  v-if="
                    app.isUpdating && app.pendingStatus === 'approved'
                  "
                  class="spinner-border spinner-border-sm me-1"
                ></span>
                Утвердить
              </button>
              <button
                class="btn btn-sm btn-outline-danger"
                :disabled="
                  app.status === 'rejected' || app.isUpdating
                "
                @click="changeStatus(app, 'rejected')"
              >
                <span
                  v-if="
                    app.isUpdating && app.pendingStatus === 'rejected'
                  "
                  class="spinner-border spinner-border-sm me-1"
                ></span>
                Отклонить
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="alert alert-warning">Нет заявок.</div>
    </div>

    <!-- 3. Тут держим только router-view в флюиде, без лишних стилей -->
    <div class="mt-4">
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

    // модалки
    const indPart = ref(null);
    const indUser = ref(null);
    const teamMembers = ref([]);
    const coach = ref(null);
    const coachLoading = ref(false);

    // отображение статусов
    const statusMap = {
      pending:  "На рассмотрении",
      approved: "Утверждена",
      rejected: "Отклонена",
    };

    const token = localStorage.getItem("access_token");
    const headers = {
      "Content-Type":  "application/json",
      Authorization:   `Bearer ${token}`,
    };

    // форматирование ФИО
    const formatName = (u) =>
      u
        ? `${u.last_name} ${u.first_name}${u.middle_name ? " " + u.middle_name : ""}`
        : "—";

    // 1) Загрузка соревнования
    const loadCompetition = async () => {
      const res = await fetch("http://localhost:8000/competitions/", { headers });
      const all = await res.json();
      competition.value = all.find((c) => c.id === compId) || null;
    };

    // 2) Загрузка заявок + подгрузка participantUser для инд. заявок
    const loadApplications = async () => {
      const res = await fetch(
        `http://localhost:8000/applications/?competition_id=${compId}`,
        { headers }
      );
      const data = await res.json();

      // инициализируем
      applications.value = data.map((app) => ({
        ...app,
        isUpdating:      false,
        pendingStatus:   null,
        participantUser: null,
      }));

      // подгружаем участника для индивидуальных
      await Promise.all(
        applications.value.map(async (app) => {
          if (
            app.request_type_id !== 2 &&
            app.individual_participants?.length
          ) {
            const uid = app.individual_participants[0].user_id;
            try {
              const r = await fetch(`http://localhost:8000/users/${uid}`, { headers });
              if (r.ok) app.participantUser = await r.json();
            } catch (e) {
              console.error("Ошибка загрузки участника:", e);
            }
          }
        })
      );
    };

    onMounted(async () => {
      await loadCompetition();
      await loadApplications();
    });

    // Смена статуса с мгновенным UI-feedback
    const changeStatus = async (app, newStatus) => {
      app.isUpdating = true;
      app.pendingStatus = newStatus;
      try {
        const res = await fetch(
          `http://localhost:8000/applications/${app.id}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status: newStatus }),
          }
        );
        if (res.ok) {
          app.status = newStatus;
        } else console.error("API error", res.status);
      } catch (e) {
        console.error("Network error:", e);
      } finally {
        app.isUpdating = false;
        app.pendingStatus = null;
      }
    };

    // Открытие модалок (ваш код)
    const handleCardClick = async (app) => {
      if (app.request_type_id !== 2) {
        indPart.value = app.individual_participants?.[0] || null;
        if (indPart.value) {
          const u = await fetch(`http://localhost:8000/users/${indPart.value.user_id}`, { headers });
          indUser.value = await u.json();
        }
        new bootstrap.Modal("#individualModal").show();
      } else {
        teamMembers.value = app.team_participants || [];
        coachLoading.value = true;
        if (app.team_id) {
          const tr = await fetch(`http://localhost:8000/teams/${app.team_id}`, { headers });
          const t  = await tr.json();
          const cr = await fetch(`http://localhost:8000/users/${t.coach_id}`, { headers });
          coach.value = await cr.json();
        }
        coachLoading.value = false;
        new bootstrap.Modal("#teamModal").show();
      }
    };

    const formatDate = (d) =>
      d ? new Date(d).toLocaleDateString("ru-RU") : "—";

    // статус соревнования
    const statusClass = (st) => ({
      "badge bg-primary":            st === "Открыта",
      "badge bg-warning text-dark":  st === "Проводится",
      "badge bg-success":            st === "Завершено",
      "badge bg-secondary":          true,
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
      statusMap,
      changeStatus,
      handleCardClick,
      formatDate,
      formatName,
      statusClass,
      statusText,
    };
  },
};
</script>
