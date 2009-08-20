class CreateWinnerPrizes < ActiveRecord::Migration
  def self.up
    create_table :winner_prizes, :id => false do |t|
      t.references :game_type
      t.integer :grade
			t.decimal :prize, :precision => 10, :scale => 2, :default => 0
    end
  end

  def self.down
    drop_table :winner_prizes
  end
end
