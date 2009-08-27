class CreateWinnerPrizes < ActiveRecord::Migration
  def self.up
    create_table :winner_prizes do |t|
      t.references :game_type
      t.integer :grade
			t.decimal :prize_part, :precision => 10, :scale => 2
    end
  end

  def self.down
    drop_table :winner_prizes
  end
end
