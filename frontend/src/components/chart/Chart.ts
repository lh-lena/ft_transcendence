import { Chart, ChartConfiguration } from "chart.js";

interface GameData {
  month: string;
  gamesPlayed: number;
}

export class GameChart {
  private chart: Chart | null = null;

  constructor(
    private canvasId: string,
    private data: GameData[],
    private options?: {
      title?: string;
      chartType?: "bar" | "line" | "pie" | "doughnut";
      backgroundColor?: string;
      borderColor?: string;
    },
  ) {}

  public render(): void {
    const canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
    
    if (!canvas) {
      throw new Error(`Canvas element with ID '${this.canvasId}' not found`);
    }

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration = {
      type: this.options?.chartType || "bar",
      data: {
        labels: this.data.map((row) => row.month),
        datasets: [
          {
            label: this.options?.title || "Games Played by Month",
            data: this.data.map((row) => row.gamesPlayed),
            backgroundColor:
              this.options?.backgroundColor || "rgba(54, 162, 235, 0.2)",
            borderColor: this.options?.borderColor || "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };

    this.chart = new Chart(canvas, config);
  }

  public updateData(newData: GameData[]): void {
    this.data = newData;
    if (this.chart) {
      this.chart.data.labels = this.data.map((row) => row.month);
      this.chart.data.datasets[0].data = this.data.map(
        (row) => row.gamesPlayed,
      );
      this.chart.update();
    }
  }

  public destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
